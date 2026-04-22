class DialogueScene {
    constructor(game, startNodeId) {
        this.game = game;
        this.removeFromWorld = false;
        this.paused = false;  // set true while CharacterSheetScene / SettingsScene overlay is open

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
        this.ducShakeTimer = 0;
        this.ducShakeDuration = 0.6;

        // character sprites
        this.currentGuySprite = null;
        this.currentGirlSprite = null;
        this.breathTimer = 0;
        this.charOpacity = 0;
        this.playerOpacity = 0;

        // UI state
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;
        this.nextBtnPressed = false;
        this.replyBtnPressedIndex = -1;

        // gear button in game settings access, bottom right corner
        this.gearBtn = {x: 1920 - 180, y: 1080 - 120, w: 140, h: 90};
        this.gearHovered = false;
        this.gearPressed = false;

        // fade in
        this.fadeAlpha = 1;
        this.fadingIn = true;
        // fade out to day transition
        this.fadingOut = false;
        this.fadeOutAlpha = 0;
        this.fadeOutTarget = null;  // function to call when fade completes

        // Layout constants (canvas is 1920x1080)
        this.CHAR_BOX = {x: 80, y: 760, w: 210, h: 210};
        this.DLG = {x: 60, y: 740, w: 1800, h: 250};
        this.NEXT = {x: 1730, y: 890, w: 100, h: 88};
        this.SPEAKER = {x: 60, y: 660, w: 380, h: 70};

        // reply button grid, shown during "choice" phase
        this.REPLY_W = 820;
        this.REPLY_H = 110;
        this.REPLY_GAP = 22;

        // vfx sprite sheet stuff
        this.VFX_DEFS = {
            hearts_rising:  { asset: "./assets/vfx/hearts_rising.png",  cols: 5, rows: 4, total: 20, fps: 15 },
            heart_crumble:  { asset: "./assets/vfx/heart_crumble.png",  cols: 5, rows: 3, total: 15, fps: 15 },
            analysis_error: { asset: "./assets/vfx/analysis_error.png", cols: 5, rows: 3, total: 15, fps: 15 },
            hearts_sparkle: { asset: "./assets/vfx/hearts_sparkle.png", cols: 5, rows: 2, total: 10, fps: 15 },
            touch_effect:   { asset: "./assets/vfx/touch_effect.png",   cols: 5, rows: 3, total: 15, fps: 15 },
            heart_pulse:    { asset: "./assets/vfx/heart_pulse.png",    cols: 5, rows: 4, total: 20, fps: 15 },
            heart_form:     { asset: "./assets/vfx/heart_form.png",     cols: 5, rows: 5, total: 25, fps: 15 },
            pink_burst:     { asset: "./assets/vfx/pink_burst.png",     cols: 5, rows: 3, total: 15, fps: 15 },
            distorted_heart:{ asset: "./assets/vfx/distorted_heart.png", cols: 5, rows: 4, total: 20, fps: 15 },
        };
        this.activeVFX = [];

        // I-key handler
        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        this.loadNode(startNodeId || data.start);
    }

    onKey(e) {
        if (this.fadingIn || this.fadingOut || this.paused) return;

        if (e.key === "i" || e.key === "I") {
            this.paused = true;
            this.game.addEntity(new CharacterSheetScene(this.game, this));
        } else if (e.key === "s" || e.key === "S") {
            // quick keyboard shortcut to open Settings
            this.paused = true;
            this.game.addEntity(new SettingsScene(this.game, this));
        }
    }

    sub(text) {
        return text.replace(/{PLAYER_NAME}/g, GameState.playerName);
    }

    remapForDay(nodeId) {
        const match = nodeId.match(/^(duc|muhammed|mikhail)_day1_intro$/);
        if (!match) return nodeId;
        const who = match[1];
        GameState.visitCounts[who]++;
        const interactionNum = Math.min(GameState.visitCounts[who], 3);
        return `${who}_day${interactionNum}_intro`;
    }

    loadNode(nodeId) {
        if (this.phase === "system" || this.phase === "system_pause") {
            MUSIC.stopTyping();
        }

        if (!nodeId) {
            this.phase = "end";
            return;
        }

        nodeId = this.remapForDay(nodeId);

        if (nodeId === "tutorialDebrief") {
            this.handleDebrief();
            return;
        }

        if (nodeId === "tutorial_morning" && GameState.visitedToday) {
            this.loadNode("dayEnd");
            return;
        }

        if (nodeId === "dayEnd") {
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
        if (node.type === "system") {
            this.phase = "system";
            this.systemLines = node.lines.map(l => this.sub(l));
            this.systemLineIndex = 0;
            this.systemLineTimer = 0;
            this.pendingNextForSystem = node.next;
            // System screens = "A problem has been detected"-style BSOD. Start typing SFX.
            MUSIC.startTyping();
        } else {
            this.phase = "typing";
            // check if NPC remembers something you said
            var txt = node.text;
            if (node.memoryText) {
                for (var mem in node.memoryText) {
                    if (GameState.hasMemory(mem)) { txt = node.memoryText[mem]; break; }
                }
            }
            this.fullText = this.sub(txt);
            this.displayText = "";
            this.charIndex = 0;
            this.typingTimer = 0;
            this.currentSpeaker = node.speaker || "";
            this.currentPortrait = node.portrait || "";
            this.currentChoices = node.choices || null;
            this.nextNodeId = node.next || null;

            if (this.currentSpeaker === "TUTORIAL" && !GameState.metCharacters.tutorial) {
                GameState.metCharacters.tutorial = true;
            }

            const folderMap = {"ĐỨC": "guy1", "MUHAMMED": "guy3", "MIKHAIL": "guy2"};
            const folder = folderMap[this.currentSpeaker];
            if (!folder) {
                this.currentGuySprite = null;
            } else {
                const guyExpr = node.expression || "Neutral";
                this.currentGuySprite = ASSET_MANAGER.getAsset(`./assets/characters/${folder}/${guyExpr}.png`)
                    || ASSET_MANAGER.getAsset(`./assets/characters/${folder}/Neutral.png`);

                const girlExpr = node.playerExpr || "Natu";
                this.currentGirlSprite = ASSET_MANAGER.getAsset(`./assets/characters/girl1/${girlExpr}.png`)
                    || ASSET_MANAGER.getAsset("./assets/characters/girl1/Natu.png");
            }

            if (node.bug === "duc_reboot") {
                this.ducShakeTimer = this.ducShakeDuration;
            }
        }
    }

    handleDebrief() {
        var who = GameState.visitedToday;
        var num = who ? GameState.visitCounts[who] : 1;
        if (num > 3) num = 3;
        var reactNode = who ? "tutorialReact" + who + num : "dayEnd";
        if (this.data.nodes[reactNode]) {
            this.loadNode(reactNode);
        } else {
            this.loadNode("dayEnd"); // fallback if node doesnt exist yet
        }
    }

    _handleDayEnd() {
        MUSIC.stopTyping();
        const ending = GameState.checkEnding();
        if (ending) {
            this._fadeTo(() => {
                this.game.addEntity(new EndingScene(this.game, ending));
                document.removeEventListener("keydown", this.keyHandler);
                this.removeFromWorld = true;
            });
            return;
        }
        GameState.advanceDay();
        this._fadeTo(() => {
            this.game.addEntity(new BootDayScene(this.game, "tutorial_morning"));
            document.removeEventListener("keydown", this.keyHandler);
            this.removeFromWorld = true;
        });
    }

    _fadeTo(callback) {
        this.fadingOut = true;
        this.fadeOutTarget = callback;
    }

    playVFX(name, x, y, scale) {
        var def = this.VFX_DEFS[name];
        if (!def) return;
        this.activeVFX.push({
            def, x: x || 960, y: y || 400, scale: scale || 1,
            frame: 0, timer: 0, done: false
        });
    }

    _gearHit(p) {
        const g = this.gearBtn;
        return p && p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h;
    }

    update() {
        // detect overlay close: if we're paused and no overlay exists, unpause
        if (this.paused) {
            const hasOverlay = this.game.entities.some(
                e => (e instanceof CharacterSheetScene || e instanceof SettingsScene) && !e.removeFromWorld
            );
            if (!hasOverlay) this.paused = false;
            else return;
        }

        const dt = this.game.clockTick;
        const click = this.game.click;
        const mouse = this.game.mouse;

        // tick vfx animations
        for (var v = this.activeVFX.length - 1; v >= 0; v--) {
            var fx = this.activeVFX[v];
            fx.timer += dt;
            if (fx.timer >= 1 / fx.def.fps) {
                fx.timer -= 1 / fx.def.fps;
                fx.frame++;
                if (fx.frame >= fx.def.total) {
                    this.activeVFX.splice(v, 1);
                }
            }
        }
        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.6);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
        }

        if (this.fadingOut) {
            this.fadeOutAlpha = Math.min(1, this.fadeOutAlpha + dt * 1.8);
            if (this.fadeOutAlpha >= 1 && this.fadeOutTarget) {
                const cb = this.fadeOutTarget;
                this.fadeOutTarget = null;
                cb();
            }
            return;
        }

        if (this.ducShakeTimer > 0) this.ducShakeTimer -= dt;

        if (this.charOpacity < 1) this.charOpacity = Math.min(1, this.charOpacity + dt * 0.67);
        if (this.playerOpacity < 1) this.playerOpacity = Math.min(1, this.playerOpacity + dt * 0.67);
        this.breathTimer += dt * 2.5;

        // Gear button hover (only shown in normal dialogue, not system screens)
        this.gearHovered = false;
        if (mouse && this.phase !== "system" && this.phase !== "system_pause") {
            this.gearHovered = this._gearHit(mouse);
        }

        // Click gear -> open Settings overlay
        if (click && this.phase !== "system" && this.phase !== "system_pause" && this._gearHit(click)) {

            this.gearPressed = true;
            setTimeout(() => {
                this.gearPressed = false;
            }, 120);
            this.paused = true;
            this.game.addEntity(new SettingsScene(this.game, this));
            this.game.click = null;
            return;
        }

        if (this.phase === "system") {
            this.systemLineTimer += dt;
            if (this.systemLineTimer >= 0.45) {
                this.systemLineTimer = 0;
                this.systemLineIndex++;
                if (this.systemLineIndex >= this.systemLines.length) {
                    this.phase = "system_pause";
                    this.pauseTimer = 0;
                    MUSIC.stopTyping(); // typewriter finished
                }
            }
            if (click) {

                this.systemLineIndex = this.systemLines.length;
                this.phase = "system_pause";
                this.pauseTimer = 0;
                MUSIC.stopTyping();
                this.game.click = null;
            }
            return;
        }

        if (this.phase === "system_pause") {
            this.pauseTimer += dt;
            if (this.pauseTimer >= 1.0 || click) {
                if (click)
                    this.game.click = null;
                this.loadNode(this.pendingNextForSystem);
            }
            return;
        }

        let justFinishedTyping = false;

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

        if (click) {
            const cx = click.x;
            const cy = click.y;
            this.game.click = null;

            if (this.phase === "typing" || justFinishedTyping) {

                this.charIndex = this.fullText.length;
                this.displayText = this.fullText;
                this.phase = "idle";
                return;
            }

            if (this.phase === "idle") {
                if (this.currentNode && this.currentNode.bug === "muhammed_loop") {
                    this.muhammedLoopPressed++;
                    if (this.muhammedLoopPressed < 3) {

                        this.nextBtnPressed = true;
                        setTimeout(() => {
                            this.nextBtnPressed = false;
                        }, 120);
                        return;
                    }
                }

                const n = this.NEXT, d = this.DLG;
                const onNext = cx >= n.x && cx <= n.x + n.w && cy >= n.y && cy <= n.y + n.h;
                const onBox = cx >= d.x && cx <= d.x + d.w && cy >= d.y && cy <= d.y + d.h;
                if (onNext || onBox) {

                    if (onNext) {
                        this.nextBtnPressed = true;
                        setTimeout(() => {
                            this.nextBtnPressed = false;
                        }, 120);
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

                        const gameFlag = choice.oncePerGame;
                        const dayFlag = choice.oncePerDay;
                        const flagBlocks = (gameFlag && GameState.hasFlag(gameFlag, "game")) ||
                            (dayFlag && GameState.hasFlag(dayFlag, "day"));

                        if (choice.points && !flagBlocks) {
                            for (const k in choice.points) {
                                GameState.addPoints(k, choice.points[k]);
                            }
                        }
                        if (gameFlag) GameState.setFlag(gameFlag, "game");
                        if (dayFlag) GameState.setFlag(dayFlag, "day");
                        if (choice.visit) {
                            GameState.visitedToday = choice.visit;
                            if (GameState.metCharacters[choice.visit] === false) {
                                GameState.metCharacters[choice.visit] = true;
                            }
                        }
                        if (choice.memory) GameState.addMemory(choice.memory);
                        if (choice.chaos) GameState.addChaos(choice.chaos, choice.text);

                        if (choice.points && !flagBlocks) {
                            var total = 0;
                            for (var k2 in choice.points) total += choice.points[k2];

                            var offsetX = (Math.random() - 0.5) * 200;
                            var offsetY = (Math.random() - 0.5) * 120;

                            if (choice.chaos) {
                                this.playVFX("analysis_error", 960 + offsetX, 380 + offsetY, 3);
                            } else if (total > 0) {
                                var vfxName = total >= 8 ? "heart_pulse" : "heart_form";
                                this.playVFX(vfxName, 960 + offsetX, 380 + offsetY, 3);
                            } else if (total < 0) {
                                this.playVFX("distorted_heart", 960 + offsetX, 380 + offsetY, 3);
                            }

                        }

                        setTimeout(() => {
                            this.replyBtnPressedIndex = -1;
                        }, 120);

                        const ending = GameState.checkEnding();
                        if (ending) {
                            this._fadeTo(() => {
                                this.game.addEntity(new EndingScene(this.game, ending));
                                document.removeEventListener("keydown", this.keyHandler);
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
        const n = this.currentChoices ? this.currentChoices.length : 4;
        const x = 1920 / 2 - this.REPLY_W / 2;
        const totalH = n * this.REPLY_H + (n - 1) * this.REPLY_GAP;
        const startY = 1080 / 2 - totalH / 2 + 70;
        const y = startY + i * (this.REPLY_H + this.REPLY_GAP);
        return {x, y, w: this.REPLY_W, h: this.REPLY_H};
    }

    draw(ctx) {
        const AM = ASSET_MANAGER;
        const W = 1920, H = 1080;

        const bg = AM.getAsset("./assets/DatingGameUI/Background.jpg");
        if (bg) ctx.drawImage(bg, 0, 0, W, H);


        if (this.phase === "system" || this.phase === "system_pause") {
            this.drawSystem(ctx, W, H);
        } else if (this.phase === "end") {
            // nothing; EndingScene should take over
        } else {
            this.drawCharacterAndDialogue(ctx, AM);
        }

        for (var v = 0; v < this.activeVFX.length; v++) {
            var fx = this.activeVFX[v];
            var img = ASSET_MANAGER.getAsset(fx.def.asset);
            if (!img) continue;
            var fw = img.width / fx.def.cols;
            var fh = img.height / fx.def.rows;
            var sx = (fx.frame % fx.def.cols) * fw;
            var sy = Math.floor(fx.frame / fx.def.cols) * fh;
            var s = fx.scale || 1;
            var dw = fw * s;
            var dh = fh * s;
            ctx.drawImage(img, sx, sy, fw, fh, fx.x - dw/2, fx.y - dh/2, dw, dh);
        }

        if (this.phase !== "system" && this.phase !== "system_pause") {
            this.drawHUD(ctx);
            this.drawGearButton(ctx);
        }

        if (this.fadingIn && this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (this.fadingOut) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeOutAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    drawSystem(ctx, W, H) {
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

    drawCharacterAndDialogue(ctx, AM) {
        let shakeX = 0, shakeY = 0;
        if (this.ducShakeTimer > 0) {
            const intensity = (this.ducShakeTimer / this.ducShakeDuration) * 14;
            shakeX = (Math.random() - 0.5) * intensity * 2;
            shakeY = (Math.random() - 0.5) * intensity * 2;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        if (this.phase === "typing" || this.phase === "idle" || this.phase === "choice") {
            const isChoice = this.phase === "choice";

            this.drawCharSprite(ctx, isChoice);
            this.drawDialogueBox(ctx, AM);
            this.drawCharacterContainer(ctx, AM);
            this.drawSpeakerLabel(ctx);

            if (isChoice && this.currentChoices) {
                this.drawReplyButtons(ctx, AM);
            }
        }

        ctx.restore();

        if (this.ducShakeTimer > 0) {
            ctx.fillStyle = `rgba(255, 30, 30, ${(this.ducShakeTimer / this.ducShakeDuration) * 0.22})`;
            ctx.fillRect(0, 0, 1920, 1080);
        }
    }

    drawCharSprite(ctx, isChoice) {
        const guyImg = this.currentGuySprite;
        const girlImg = this.currentGirlSprite ||
            ASSET_MANAGER.getAsset("./assets/characters/girl1/Natu.png");

        const W = 1920, H = 1080;
        const breathY = Math.sin(this.breathTimer) * 4;
        const breathY2 = Math.sin(this.breathTimer * 0.85 + 1) * 3;
        const guyTalking = this.currentSpeaker && !isChoice;

        const girlScale = 0.85;
        const girlX = isChoice ? -W * 0.18 : -W * 0.28;
        const girlY = H * (1 - girlScale);
        const guyX = guyTalking ? W * 0.18 : W * 0.28;

        const drawGirl = () => {
            if (!girlImg) return;
            ctx.save();
            ctx.globalAlpha = this.playerOpacity;
            ctx.drawImage(girlImg, girlX, girlY + breathY, W * girlScale, H * girlScale);
            ctx.restore();
        };
        const guyScale = 1.45;
        const drawGuy = () => {
            if (!guyImg) return;
            ctx.save();
            ctx.globalAlpha = this.charOpacity;
            const gW = W * guyScale;
            const gH = H * guyScale;
            const scaleOffX = (gW - W) / 2;
            ctx.drawImage(guyImg, guyX - scaleOffX, breathY2, gW, gH);
            ctx.restore();
        };

        if (guyTalking) {
            drawGirl();
            drawGuy();
        } else {
            drawGuy();
            drawGirl();
        }
    }

    drawCharacterContainer(ctx, AM) {
        const c = this.CHAR_BOX;
        const containerImg = AM.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");
        if (containerImg) {
            ctx.drawImage(containerImg, c.x, c.y, c.w, c.h);
        }

        const faceMap = {
            "ĐỨC": "./assets/characters/guy1/Face.png",
            "MUHAMMED": "./assets/characters/guy3/Face.png",
            "MIKHAIL": "./assets/characters/guy2/Face.png",
        };
        const facePath = faceMap[this.currentSpeaker];
        const faceImg = facePath ? ASSET_MANAGER.getAsset(facePath) : null;

        if (faceImg) {
            var ip = 18;
            ctx.drawImage(faceImg, c.x + ip, c.y + ip - 12, c.w - ip * 2, c.h - ip * 2);
        }
    }

    drawSpeakerLabel(ctx) {
        if (!this.currentSpeaker) return;
        const s = this.SPEAKER;

        const speakerColor = {
            "ĐỨC": "#3a5a9a",
            "MUHAMMED": "#d87a1f",
            "MIKHAIL": "#a02030",
            "TUTORIAL": "#2a9090",
            "SYSTEM": "#ff2200",
            "???": "#666666",
        }[this.currentSpeaker] || "#e8006f";

        var labelBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        if (labelBg) {
            ctx.drawImage(labelBg, s.x, s.y, s.w, s.h);
        }


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

    drawDialogueBox(ctx, AM) {
        const d = this.DLG;
        const dlgImg = AM.getAsset("./assets/DatingGameUI/Dialogue/DialogueContainer.png");

        if (dlgImg) {
            ctx.drawImage(dlgImg, d.x, d.y, d.w, d.h);
        }

        let renderText = this.displayText;

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#1a1a4e";

        if (this.currentNode && this.currentNode.bug === "muhammed_loop" && this.phase === "idle") {
            const fonts = [
                "bold 22px 'The Bold Font', Georgia, serif",
                "italic 22px 'Roboto', sans-serif",
                "bold 22px 'Lucida Console', monospace",
            ];
            let y = d.y + 20;
            for (let i = 0; i < 3; i++) {
                ctx.font = fonts[i];
                ctx.globalAlpha = i < this.muhammedLoopPressed ? 0.4 : 1;
                this.wrapText(ctx, renderText, d.x + 280, y, d.w - 380, 28);
                y += 68;
            }
            ctx.globalAlpha = 1;

            ctx.font = "italic 18px 'Roboto', sans-serif";
            ctx.fillStyle = "rgba(100, 100, 140, 0.75)";
            ctx.fillText(
                `(loop ${this.muhammedLoopPressed + 1} / 3; click Next to skip)`,
                d.x + 280,
                d.y + d.h - 28
            );
        } else {
            ctx.font = "bold 32px 'The Bold Font', Georgia, serif";
            this.wrapText(ctx, renderText, d.x + 280, d.y + 40, d.w - 380, 44);
        }

        if (this.phase === "idle" && (this.nextNodeId || this.currentChoices)) {
            const n = this.NEXT;
            const key = (this.nextBtnHovered || this.nextBtnPressed)
                ? "./assets/DatingGameUI/NextBtnPressed.png"
                : "./assets/DatingGameUI/NextBtn.png";
            const img = AM.getAsset(key);
            if (img) {
                ctx.drawImage(img, n.x, n.y, n.w, n.h);
            }
        }
    }

    drawReplyButtons(ctx, AM) {
        const rKey = "./assets/DatingGameUI/Dialogue/ReplyBtn.png";
        const rpKey = "./assets/DatingGameUI/Dialogue/ReplyBtnPressed.png";

        for (let i = 0; i < this.currentChoices.length; i++) {
            const r = this._choiceRect(i);
            const isHov = i === this.hoveredChoice;
            const isPressed = i === this.replyBtnPressedIndex;

            if (isHov && !isPressed) {
                ctx.save();
                ctx.shadowColor = "#ff4fa0";
                ctx.shadowBlur = 28;
            }


            const img = AM.getAsset(isPressed ? rpKey : rKey);
            if (img) {
                ctx.drawImage(img, r.x, r.y, r.w, r.h);
            }
                if (isHov && !isPressed) {
                    ctx.restore();
                }

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 28px 'The Bold Font', serif";
            ctx.fillStyle = "#3a1a4e";
            const label = this.currentChoices[i].text;
            this.wrapTextCentered(ctx, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 60, 34);
        }
    }

    drawHUD(ctx) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        var hudBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        if (hudBg) {
            ctx.drawImage(hudBg, 1920 - 340, 28, 312, 64);
        }


        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 24px 'The Bold Font', serif";
        ctx.fillStyle = "#4a2a58";
        ctx.fillText(`DAY ${GameState.currentDay}  ·  Press I`, 1920 - 340 + 156, 60);
    }

    drawGearButton(ctx) {
        var g = this.gearBtn;
        var greenBtn = ASSET_MANAGER.getAsset(this.gearHovered
            ? "./assets/DatingGameUI/GreenBtnPressed.png"
            : "./assets/DatingGameUI/GreenBtn.png");
        var gearIcon = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");

        if (greenBtn) {
            ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        }
        if (gearIcon) {
            var cx = g.x + g.w / 2;
            var cy = g.y + g.h / 2;
            var scale = 56 / Math.max(gearIcon.width || 56, gearIcon.height || 56);
            var w = (gearIcon.width || 56) * scale;
            var h = (gearIcon.height || 56) * scale;
            ctx.drawImage(gearIcon, cx - w / 2, cy - h / 2, w, h);
        }
    }


    wrapText(ctx, text, x, y, maxW, lineH) {
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

    wrapTextCentered(ctx, text, cx, cy, maxW, lineH) {
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