class DialogueScene {
    constructor(game, startNodeId) {
        this.game = game;
        this.removeFromWorld = false;
        this.paused = false;  // set true while CharacterSheetScene overlay is open

        const data = window.DIALOGUE_DATA;
        this.data = data;

        // Typing effect state
        this.displayText = "";
        this.fullText = "";
        this.charIndex = 0;
        this.typingTimer = 0;
        this.typingSpeed = 0.025;

        // dialogue state
        // phases: "typing" | "idle" | "choice" | "system" | "system_pause" | "end_trigger"
        this.phase = "typing";
        this.currentSpeaker = "";
        this.currentPortrait = "";
        this.currentChoices = null;
        this.nextNodeId = null;
        this.currentNode = null;

        // system state
        this.systemLines = [];
        this.systemLineIndex = 0;
        this.systemLineTimer = 0;
        this.pauseTimer = 0;
        this.pendingNextForSystem = null;

        // bug mechanic state
        this.muhammedLoopCount = 0;      // how many repeats have been rendered (0-2)
        this.muhammedLoopPressed = 0;    // user has clicked Next this many times
        this.mikhailGarbleSeed = 0;
        this.ducShakeTimer = 0;
        this.ducShakeDuration = 0.6;

        // UI state
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;
        this.nextBtnPressed = false;
        this.replyBtnPressedIndex = -1;

        // fade in
        this.fadeAlpha = 1;
        this.fadingIn = true;
        // fade out to day transition
        this.fadingOut = false;
        this.fadeOutAlpha = 0;
        this.fadeOutTarget = null;  // function to call when fade completes

        // Layout constants (canvas is 1920x1080)
        //   Character portrait - minimized icon inside the left of the dialogue box
        this.CHAR_BOX = { x: 80, y: 760, w: 210, h: 210 };
        //   Dialogue box - bottom strip, full width (upscaled height)
        this.DLG      = { x: 60,  y: 740, w: 1800, h: 250 };
        //   Next button inside the dialogue box (bottom-right corner)
        this.NEXT     = { x: 1760, y: 910, w: 64,  h: 56 };
        //   Speaker name container - left of dialogue box, centered vertically
        //   (placed above the dialogue container per user spec)
        this.SPEAKER  = { x: 60, y: 660, w: 380, h: 70 };

        // reply button grid, shown during "choice" phase, takes up center
        // 4 equal buttons, centered horizontally
        this.REPLY_W = 820;
        this.REPLY_H = 110;
        this.REPLY_GAP = 22;

        // I-key handler
        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        this.loadNode(startNodeId || data.start);
    }

    _onKey(e) {
        if (e.key === "i" || e.key === "I") {
            // Don't open while fading
            if (this.fadingIn || this.fadingOut || this.paused) return;
            // Eat the keypress
            this.paused = true;
            this.game.addEntity(new CharacterSheetScene(this.game, this));
            // When the overlay closes, it removes itself; we detect that in update()
            // and unpause. For now just flip the flag.
        }
    }

    _sub(text) {
        return text.replace(/{PLAYER_NAME}/g, GameState.playerName);
    }

    // Hub routing, if player selected a bachelor visit, remap the day1 node id
    // to the appropriate day-N id based on GameState.visitCounts.
    _remapForDay(nodeId) {
        const match = nodeId.match(/^(duc|muhammed|mikhail)_day1_intro$/);
        if (!match) return nodeId;
        const who = match[1];
        
        // increment visit count for this character
        GameState.visitCounts[who]++;
        const interactionNum = Math.min(GameState.visitCounts[who], 3);
        
        return `${who}_day${interactionNum}_intro`;
    }

    loadNode(nodeId) {
        if (!nodeId) { this.phase = "end"; return; }

        // remap day 1 entry points to current-day entry points
        nodeId = this._remapForDay(nodeId);

        // special node: day_end triggers day advancement
        if (nodeId === "day_end") {
            this._handleDayEnd();
            return;
        }

        const node = this.data.nodes[nodeId];
        if (!node) {
            console.warn("Missing dialogue node:", nodeId);
            this.phase = "end";
            return;
        }

        this.currentNodeId = nodeId;
        this.currentNode = node;

        // reset per-node bug state
        this.muhammedLoopCount = 0;
        this.muhammedLoopPressed = 0;
        this.mikhailGarbleSeed = Math.random() * 1000;

        if (node.type === "system") {
            this.phase = "system";
            this.systemLines = node.lines.map(l => this._sub(l));
            this.systemLineIndex = 0;
            this.systemLineTimer = 0;
            this.pendingNextForSystem = node.next;
        } else {
            this.phase = "typing";
            this.fullText = this._sub(node.text);
            this.displayText = "";
            this.charIndex = 0;
            this.typingTimer = 0;
            this.currentSpeaker = node.speaker || "";
            this.currentPortrait = node.portrait || "";
            this.currentChoices = node.choices || null;
            this.nextNodeId = node.next || null;

            // unlock Tutorial character sheet once he introduces himself as "TUTORIAL"
            if (this.currentSpeaker === "TUTORIAL" && !GameState.metCharacters.tutorial) {
                GameState.metCharacters.tutorial = true;
            }

            // trigger Đức shake effect if this node declares a reboot bug
            // we detect reboot arrival: if node.bug is 'duc_reboot', we are ON the
            // "warning; emotional payload..." line itself. Play a shake.
            if (node.bug === "duc_reboot") {
                this.ducShakeTimer = this.ducShakeDuration;
            }
        }
    }

    _handleDayEnd() {
        // check endings first
        const ending = GameState.checkEnding();
        if (ending) {
            this._fadeTo(() => {
                this.game.addEntity(new EndingScene(this.game, ending));
                this.removeFromWorld = true;
            });
            return;
        }
        // advance the day, route to BSOD boot
        GameState.advanceDay();
        this._fadeTo(() => {
            this.game.addEntity(new BootDayScene(this.game, "tutorial_morning"));
            this.removeFromWorld = true;
        });
    }

    _fadeTo(callback) {
        this.fadingOut = true;
        this.fadeOutTarget = callback;
    }

    update() {
        // detect overlay close: if we're paused and no CharacterSheetScene exists
        // in the engine anymore, unpause ourselves.
        if (this.paused) {
            const hasOverlay = this.game.entities.some(
                e => e instanceof CharacterSheetScene && !e.removeFromWorld
            );
            if (!hasOverlay) this.paused = false;
            else return; // frozen while overlay is up
        }

        const dt = this.game.clockTick;
        const click = this.game.click;
        const mouse = this.game.mouse;

        // Fade in
        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.6);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
        }

        // Fade out (to next scene)
        if (this.fadingOut) {
            this.fadeOutAlpha = Math.min(1, this.fadeOutAlpha + dt * 1.8);
            if (this.fadeOutAlpha >= 1 && this.fadeOutTarget) {
                const cb = this.fadeOutTarget;
                this.fadeOutTarget = null;
                cb();
            }
            return;
        }

        // Đức shake timer
        if (this.ducShakeTimer > 0) this.ducShakeTimer -= dt;

        // System phase (for boot/day_end/etc.)
        if (this.phase === "system") {
            this.systemLineTimer += dt;
            if (this.systemLineTimer >= 0.45) {
                this.systemLineTimer = 0;
                this.systemLineIndex++;
                if (this.systemLineIndex >= this.systemLines.length) {
                    this.phase = "system_pause";
                    this.pauseTimer = 0;
                }
            }
            if (click) {
                this.systemLineIndex = this.systemLines.length;
                this.phase = "system_pause";
                this.pauseTimer = 0;
                this.game.click = null;
            }
            return;
        }

        if (this.phase === "system_pause") {
            this.pauseTimer += dt;
            if (this.pauseTimer >= 1.0 || click) {
                if (click) this.game.click = null;
                this.loadNode(this.pendingNextForSystem);
            }
            return;
        }

        let justFinishedTyping = false;

        // typing effect
        if (this.phase === "typing") {
            this.typingTimer += dt;
            while (this.typingTimer >= this.typingSpeed && this.charIndex < this.fullText.length) {
                this.typingTimer -= this.typingSpeed;
                this.charIndex++;
                this.displayText = this.fullText.slice(0, this.charIndex);
            }
            if (this.charIndex >= this.fullText.length) {
                this.phase = "idle";
                justFinishedTyping = true;
            }
        }

        // Hover detection
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;
        if (mouse) {
            if (this.phase === "choice" && this.currentChoices) {
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this._choiceRect(i);
                    if (mouse.x >= r.x && mouse.x <= r.x + r.w &&
                        mouse.y >= r.y && mouse.y <= r.y + r.h) {
                        this.hoveredChoice = i;
                        break;
                    }
                }
            }
            if (this.phase === "idle") {
                const n = this.NEXT;
                this.nextBtnHovered = (mouse.x >= n.x && mouse.x <= n.x + n.w &&
                    mouse.y >= n.y && mouse.y <= n.y + n.h);
            }
        }

        // click handling
        if (click) {
            const cx = click.x;
            const cy = click.y;
            // always consume click immediately so it can never linger into later frames
            this.game.click = null;

            if (this.phase === "typing" || justFinishedTyping) {
                // skip typing, firmly stopping at idle and safely eating the click
                this.charIndex = this.fullText.length;
                this.displayText = this.fullText;
                this.phase = "idle";
                return;
            }

            if (this.phase === "idle") {
                // muhammed loop bug: require 3 clicks to advance
                if (this.currentNode && this.currentNode.bug === "muhammed_loop") {
                    this.muhammedLoopPressed++;
                    if (this.muhammedLoopPressed < 3) {
                        // pulse the next button to show it was pressed
                        this.nextBtnPressed = true;
                        setTimeout(() => { this.nextBtnPressed = false; }, 120);
                        return;
                    }
                }

                // click on Next button OR anywhere on dialogue box to advance
                const n = this.NEXT, d = this.DLG;
                const onNext = cx >= n.x && cx <= n.x + n.w && cy >= n.y && cy <= n.y + n.h;
                const onBox  = cx >= d.x && cx <= d.x + d.w && cy >= d.y && cy <= d.y + d.h;
                if (onNext || onBox) {
                    if (onNext) {
                        this.nextBtnPressed = true;
                        setTimeout(() => { this.nextBtnPressed = false; }, 120);
                    }
                    if (this.currentChoices) {
                        this.phase = "choice";
                    } else if (this.nextNodeId) {
                        this.loadNode(this.nextNodeId);
                    } else {
                        this.phase = "end";
                    }
                }
                return;
            }

            if (this.phase === "choice" && this.currentChoices) {
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this._choiceRect(i);
                    if (click.x >= r.x && click.x <= r.x + r.w &&
                        click.y >= r.y && click.y <= r.y + r.h) {
                        this.replyBtnPressedIndex = i;
                        const choice = this.currentChoices[i];

                        // flag gating: once-per-game / once-per-day rewards
                        const gameFlag = choice.oncePerGame;
                        const dayFlag  = choice.oncePerDay;
                        const flagBlocks = (gameFlag && GameState.hasFlag(gameFlag, "game")) ||
                            (dayFlag  && GameState.hasFlag(dayFlag, "day"));

                        // award points only if not gated
                        if (choice.points && !flagBlocks) {
                            for (const k in choice.points) {
                                GameState.addPoints(k, choice.points[k]);
                            }
                        }
                        if (gameFlag) GameState.setFlag(gameFlag, "game");
                        if (dayFlag)  GameState.setFlag(dayFlag, "day");
                        // Mark a character as 'met' if this choice commits a visit
                        if (choice.visit && GameState.metCharacters[choice.visit] === false) {
                            GameState.metCharacters[choice.visit] = true;
                            GameState.visitedToday = choice.visit;
                        }

                        // tutorial also should be marked so card appears he's not in metCharacters
                        // Tutorial is intentionally a separate card, filled with ???

                        // Short delay for pressed state visual then advance
                        setTimeout(() => { this.replyBtnPressedIndex = -1; }, 120);

                        const ending = GameState.checkEnding();
                        if (ending) {
                            this._fadeTo(() => {
                                this.game.addEntity(new EndingScene(this.game, ending));
                                this.removeFromWorld = true;
                            });
                            return;
                        }

                        this.loadNode(choice.next);
                        break;
                    }
                }
            }
        }
    }

    _choiceRect(i) {
        // center 4 buttons horizontally in the bottom half
        const n = this.currentChoices ? this.currentChoices.length : 4;
        const x = 1920 / 2 - this.REPLY_W / 2;
        // stack vertically. For up to 4 choices we have room between y=400 and y=990.
        // starting y adapts to count so the stack is vertically centered.
        const totalH = n * this.REPLY_H + (n - 1) * this.REPLY_GAP;
        const startY = 1080 / 2 - totalH / 2 + 70;
        const y = startY + i * (this.REPLY_H + this.REPLY_GAP);
        return { x, y, w: this.REPLY_W, h: this.REPLY_H };
    }

    //  DRAW
    draw(ctx) {
        const AM = ASSET_MANAGER;
        const W = 1920, H = 1080;

        // background
        const bg = AM.getAsset("./assets/DatingGameUI/Background.jpg");
        if (bg) ctx.drawImage(bg, 0, 0, W, H);
        else {
            ctx.fillStyle = "#fce4f0";
            ctx.fillRect(0, 0, W, H);
        }

        // system screens render BSOD-style
        if (this.phase === "system" || this.phase === "system_pause") {
            this._drawSystem(ctx, W, H);
        } else if (this.phase === "end") {
            // nothing; EndingScene should take over
        } else {
            this._drawCharacterAndDialogue(ctx, AM);
        }

        // HUD: small day counter top-right skip on system screens
        if (this.phase !== "system" && this.phase !== "system_pause") {
            this._drawHUD(ctx);
        }

        // fade in overlay
        if (this.fadingIn && this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
        // fade out overlay
        if (this.fadingOut) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeOutAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    _drawSystem(ctx, W, H) {
        // use BSOD styling consistent with NameInputScene
        ctx.fillStyle = "#0000A8";
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#FFFFFF";

        const lh = 46;
        const x = 90;
        const startY = 180;

        for (let i = 0; i <= Math.min(this.systemLineIndex, this.systemLines.length - 1); i++) {
            const line = this.systemLines[i];
            if (line === "") continue;
            ctx.font = (line.startsWith("***") || line.startsWith("END OF DAY") ||
                line.startsWith("UNEXPECTED") || line.startsWith("USER_") ||
                line.startsWith("DAY_"))
                ? "bold 36px 'Lucida Console', 'Consolas', monospace"
                : "32px 'Lucida Console', 'Consolas', monospace";
            ctx.fillText(line, x, startY + i * lh);
        }
    }

    _drawCharacterAndDialogue(ctx, AM) {
        // Shake offset for Đức reboot
        let shakeX = 0, shakeY = 0;
        if (this.ducShakeTimer > 0) {
            const intensity = (this.ducShakeTimer / this.ducShakeDuration) * 14;
            shakeX = (Math.random() - 0.5) * intensity * 2;
            shakeY = (Math.random() - 0.5) * intensity * 2;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // dialogue container + text (only when NOT in choice phase, i.e. character is speaking)
        if (this.phase === "typing" || this.phase === "idle") {
            // Draw dialogue box FIRST (bottom layer)
            this._drawDialogueBox(ctx, AM);

            // Draw character container ON TOP of dialogue box
            this._drawCharacterContainer(ctx, AM);

            // Draw speaker name container ON TOP
            this._drawSpeakerLabel(ctx);
        }

        // reply buttons (choice phase only)
        if (this.phase === "choice" && this.currentChoices) {
            this._drawReplyButtons(ctx, AM);
        }

        ctx.restore();

        // Red tint overlay during Đức reboot
        if (this.ducShakeTimer > 0) {
            ctx.fillStyle = `rgba(255, 30, 30, ${(this.ducShakeTimer / this.ducShakeDuration) * 0.22})`;
            ctx.fillRect(0, 0, 1920, 1080);
        }
    }

    _drawCharacterContainer(ctx, AM) {
        const c = this.CHAR_BOX;
        const containerImg = AM.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");

        if (containerImg) {
            ctx.drawImage(containerImg, c.x, c.y, c.w, c.h);
        } else {
            // fallback: pink rounded rect with inner shadow
            ctx.fillStyle = "rgba(255, 240, 248, 0.94)";
            this._roundRect(ctx, c.x, c.y, c.w, c.h, 20);
            ctx.fill();
            ctx.strokeStyle = "#ff9ccf";
            ctx.lineWidth = 4;
            this._roundRect(ctx, c.x, c.y, c.w, c.h, 20);
            ctx.stroke();

            // inner inset panel
            const pad = 30;
            ctx.fillStyle = "#f8e4f1";
            this._roundRect(ctx, c.x + pad, c.y + pad, c.w - pad * 2, c.h - pad * 2, 12);
            ctx.fill();
        }

        // portrait silhouette inside the container [placeholder for actual sprite art]
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h * 0.5;

        // tint based on character
        const speakerTint = {
            "ĐỨC":      "#7a9ed1",
            "MUHAMMED":   "#e8b066",
            "MIKHAIL":  "#a03a48",
            "TUTORIAL": "#4aa0a0",
            "???":      "#4aa0a0",
        }[this.currentSpeaker] || "#d18ebb";

        ctx.save();
        ctx.fillStyle = speakerTint;
        ctx.globalAlpha = 0.85;
        // low-res / flicker effect for Muhammed, Mikhail
        if (this.currentSpeaker === "MUHAMMED" && Math.random() < 0.03) ctx.globalAlpha = 0.5;
        if (this.currentSpeaker === "MIKHAIL" && Math.random() < 0.04) {
            ctx.translate((Math.random() - 0.5) * 6, 0);
        }
        if (this.currentSpeaker === "TUTORIAL" && Math.random() < 0.05) ctx.globalAlpha = 0.6;

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 35, 30, 0, Math.PI * 2);
        ctx.fill();
        // Body (shifted up and scaled)
        ctx.beginPath();
        ctx.ellipse(cx, cy , 50, 75, 0, Math.PI, 0, true);
        ctx.fill();
        ctx.restore();
    }

    _drawSpeakerLabel(ctx) {
        if (!this.currentSpeaker) return;
        const s = this.SPEAKER;

        const speakerColor = {
            "ĐỨC":      "#3a5a9a",
            "MUHAMMED":   "#d87a1f",
            "MIKHAIL":  "#a02030",
            "TUTORIAL": "#2a9090",
            "SYSTEM":   "#ff2200",
            "???":      "#666666",
        }[this.currentSpeaker] || "#e8006f";

        // pill background
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        this._roundRect(ctx, s.x, s.y, s.w, s.h, 14);
        ctx.fill();
        ctx.strokeStyle = speakerColor;
        ctx.lineWidth = 3;
        this._roundRect(ctx, s.x, s.y, s.w, s.h, 14);
        ctx.stroke();

        // name text [glitch effect on Tutorial occasionally]
        let nameDisplay = this.currentSpeaker;
        if (this.currentSpeaker === "TUTORIAL" && Math.random() < 0.018) {
            const glyphs = "!@#$%^&*<>?/|{}~`";
            const idx = Math.floor(Math.random() * nameDisplay.length);
            nameDisplay = nameDisplay.slice(0, idx) +
                glyphs[Math.floor(Math.random() * glyphs.length)] +
                nameDisplay.slice(idx + 1);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 40px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = speakerColor;
        ctx.fillText(nameDisplay, s.x + s.w / 2, s.y + s.h / 2);
    }

    _drawDialogueBox(ctx, AM) {
        const d = this.DLG;
        const dlgImg = AM.getAsset("./assets/DatingGameUI/Dialogue/DialogueContainer.png");

        if (dlgImg) {
            ctx.drawImage(dlgImg, d.x, d.y, d.w, d.h);
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.96)";
            this._roundRect(ctx, d.x, d.y, d.w, d.h, 18);
            ctx.fill();
            ctx.strokeStyle = "#ff6fb5";
            ctx.lineWidth = 4;
            this._roundRect(ctx, d.x, d.y, d.w, d.h, 18);
            ctx.stroke();
        }

        // determine visible text based on bug mechanics
        let renderText = this.displayText;
        if (this.currentNode) {
            if (this.currentNode.bug === "mikhail_garble") {
                renderText = this._applyGarble(this.displayText);
            }
            // muhammed loop handled in its own render pathway below
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#1a1a4e";

        if (this.currentNode && this.currentNode.bug === "muhammed_loop" && this.phase === "idle") {
            // render the line 3 times in different fonts, vertically stacked
            const fonts = [
                "bold 28px 'The Bold Font', Georgia, serif",
                "italic 28px 'Roboto', sans-serif",
                "bold 28px 'Lucida Console', monospace",
            ];
            let y = d.y + 26;
            for (let i = 0; i < 3; i++) {
                ctx.font = fonts[i];
                // dim already clicked repetitions
                ctx.globalAlpha = i < this.muhammedLoopPressed ? 0.4 : 1;
                this._wrapText(ctx, renderText, d.x + 280, y, d.w - 480, 36);
                y += 52;
            }
            ctx.globalAlpha = 1;

            // subtle hint: "Click Next to break the loop"
            ctx.font = "italic 18px 'Roboto', sans-serif";
            ctx.fillStyle = "rgba(100, 100, 140, 0.75)";
            ctx.fillText(
                `(loop ${this.muhammedLoopPressed + 1} / 3; click Next to skip)`,
                d.x + 280,
                d.y + d.h - 28
            );
        } else {
            ctx.font = "bold 32px 'The Bold Font', Georgia, serif";
            this._wrapText(ctx, renderText, d.x + 280, d.y + 40, d.w - 380, 44);
        }

        // next button (idle phase only)
        if (this.phase === "idle" && (this.nextNodeId || this.currentChoices)) {
            const n = this.NEXT;
            const key = (this.nextBtnHovered || this.nextBtnPressed)
                ? "./assets/DatingGameUI/NextBtnPressed.png"
                : "./assets/DatingGameUI/NextBtn.png";
            const img = AM.getAsset(key);
            if (img) {
                ctx.drawImage(img, n.x, n.y, n.w, n.h);
            } else {
                ctx.fillStyle = this.nextBtnHovered ? "#ff4fa0" : "#ff8fc4";
                this._roundRect(ctx, n.x, n.y, n.w, n.h, 8);
                ctx.fill();
                // draw down arrow
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.moveTo(n.x + n.w / 2, n.y + n.h * 0.75);
                ctx.lineTo(n.x + n.w * 0.3, n.y + n.h * 0.35);
                ctx.lineTo(n.x + n.w * 0.7, n.y + n.h * 0.35);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    _drawReplyButtons(ctx, AM) {
        const rKey  = "./assets/DatingGameUI/Dialogue/ReplyBtn.png";
        const rpKey = "./assets/DatingGameUI/Dialogue/ReplyBtnPressed.png";

        for (let i = 0; i < this.currentChoices.length; i++) {
            const r = this._choiceRect(i);
            const isHov = i === this.hoveredChoice;
            const isPressed = i === this.replyBtnPressedIndex;

            // neon pink halo on hover
            if (isHov && !isPressed) {
                ctx.save();
                ctx.shadowColor = "#ff4fa0";
                ctx.shadowBlur = 28;
                ctx.fillStyle = "rgba(255, 79, 160, 0.0)";
                this._roundRect(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 16);
                ctx.fill();
                // draw a translucent ring
                ctx.strokeStyle = "rgba(255, 79, 160, 0.75)";
                ctx.lineWidth = 4;
                this._roundRect(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 16);
                ctx.stroke();
                ctx.restore();
            }

            const img = AM.getAsset(isPressed ? rpKey : rKey);
            if (img) {
                ctx.drawImage(img, r.x, r.y, r.w, r.h);
            } else {
                ctx.fillStyle = isPressed ? "#cc5590" : (isHov ? "#f8a8d0" : "#ffb8dc");
                this._roundRect(ctx, r.x, r.y, r.w, r.h, 14);
                ctx.fill();
            }

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 28px 'The Bold Font', serif";
            ctx.fillStyle = "#3a1a4e";
            // Upper-case, wrapped for long choices
            const label = this.currentChoices[i].text;
            this._wrapTextCentered(ctx, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 60, 34);
        }
    }

    _drawHUD(ctx) {
        // small pill in top-right showing Day N + hint for I key
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        this._roundRect(ctx, 1920 - 340, 28, 312, 64, 14);
        ctx.fill();
        ctx.strokeStyle = "#ff9ccf";
        ctx.lineWidth = 3;
        this._roundRect(ctx, 1920 - 340, 28, 312, 64, 14);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 24px 'The Bold Font', serif";
        ctx.fillStyle = "#4a2a58";
        ctx.fillText(`DAY ${GameState.currentDay}  ·  Press I`, 1920 - 340 + 156, 60);
    }

    //  HELPERS

    _applyGarble(text) {
        // replace with a symbol pick positions based on seed.
        if (!text.length) return text;
        const symbols = "@#$!%^&*";
        const seedRng = (n) => {
            // xorshift-ish pseudo-random from seed
            let x = Math.floor(this.mikhailGarbleSeed) + n * 9301;
            x ^= x << 13; x ^= x >> 17; x ^= x << 5;
            return ((x >>> 0) % 1000) / 1000;
        };

        // pick ~4% of non-space characters to garble
        let out = "";
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === " " || c === "," || c === "." || c === ";") { out += c; continue; }
            if (seedRng(i) < 0.04) {
                out += symbols[Math.floor(seedRng(i + 500) * symbols.length)];
            } else {
                out += c;
            }
        }
        return out;
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(" ");
        let line = "";
        let cy = y;
        for (const word of words) {
            const test = line + word + " ";
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line.trimEnd(), x, cy);
                line = word + " ";
                cy += lineH;
            } else {
                line = test;
            }
        }
        if (line.trim()) ctx.fillText(line.trimEnd(), x, cy);
    }

    _wrapTextCentered(ctx, text, cx, cy, maxW, lineH) {
        const words = text.split(" ");
        const lines = [];
        let line = "";
        for (const w of words) {
            const test = line + w + " ";
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                lines.push(line.trimEnd());
                line = w + " ";
            } else {
                line = test;
            }
        }
        if (line.trim()) lines.push(line.trimEnd());

        const startY = cy - ((lines.length - 1) * lineH) / 2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], cx, startY + i * lineH);
        }
    }
}