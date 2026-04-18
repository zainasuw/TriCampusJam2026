class DialogueScene {
    constructor(game, playerName) {
        this.game = game;
        this.removeFromWorld = false;
        this.playerName = playerName || "UNKNOWN";

        const data = window.DIALOGUE_DATA;
        this.data = data;

        // Resolve start node, skip name_input marker if present
        let startId = data.start;
        if (data.nodes[startId] && data.nodes[startId].type === "name_input") {
            startId = data.nodes[startId].next;
        }

        // Typing effect state
        this.displayText = "";
        this.fullText = "";
        this.charIndex = 0;
        this.typingTimer = 0;
        this.typingSpeed = 0.028; // seconds per character

        // Dialogue state
        // phase options: "system", "system_pause", "typing", "idle", "choice", "end"
        this.phase = "system";
        this.currentSpeaker = "";
        this.currentChoices = null;
        this.nextNodeId = null;

        // System message state
        this.systemLines = [];
        this.systemLineIndex = 0;
        this.systemLineTimer = 0;
        this.pauseTimer = 0;

        // UI hover state
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;

        // Fade in from black
        this.fadeAlpha = 1;
        this.fadingIn = true;

        // canvas layout (1920x1080)
        this.DLG  = { x: 60,   y: 545, w: 1800, h: 260 };
        this.NEXT = { x: 1805, y: 720,  w: 46,   h: 42  };

        this.loadNode(startId);
    }

    sub(text) {
        return text.replace(/{PLAYER_NAME}/g, this.playerName);
    }

    loadNode(nodeId) {
        if (!nodeId) { this.phase = "end"; return; }
        const node = this.data.nodes[nodeId];
        if (!node) { this.phase = "end"; return; }

        this.currentNodeId = nodeId;

        if (node.type === "system") {
            this.phase = "system";
            this.systemLines = node.lines.map(l => this.sub(l));
            this.systemLineIndex = 0;
            this.systemLineTimer = 0;
            this.nextNodeId = node.next;
        } else if (node.type === "dialogue" || node.type === "choice") {
            this.phase = "typing";
            this.fullText = this.sub(node.text);
            this.displayText = "";
            this.charIndex = 0;
            this.typingTimer = 0;
            this.currentSpeaker = node.speaker || "";
            this.currentChoices = node.choices || null;
            this.nextNodeId = node.next || null;
        }
    }

    update() {
        const dt    = this.game.clockTick;
        const click = this.game.click;
        const mouse = this.game.mouse;

        // Fade in
        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.5);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
        }

        // system message auto advance
        if (this.phase === "system") {
            this.systemLineTimer += dt;
            if (this.systemLineTimer >= 1.0) {
                this.systemLineTimer = 0;
                this.systemLineIndex++;
                if (this.systemLineIndex >= this.systemLines.length) {
                    this.phase = "system_pause";
                    this.pauseTimer = 0;
                }
            }
        }

        if (this.phase === "system_pause") {
            this.pauseTimer += dt;
            if (this.pauseTimer >= 2.0) {
                this.fadingIn = true;
                this.fadeAlpha = 1;
                this.loadNode(this.nextNodeId);
            }
        }

        // typing effect
        if (this.phase === "typing") {
            this.typingTimer += dt;
            while (this.typingTimer >= this.typingSpeed && this.charIndex < this.fullText.length) {
                this.typingTimer -= this.typingSpeed;
                this.displayText += this.fullText[this.charIndex++];
            }
            if (this.charIndex >= this.fullText.length) {
                this.phase = this.currentChoices ? "choice" : "idle";
            }
        }

        // hover detection
        if (mouse) {
            if (this.phase === "choice" && this.currentChoices) {
                this.hoveredChoice = -1;
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this._choiceRect(i);
                    if (mouse.x >= r.x && mouse.x <= r.x + r.w &&
                        mouse.y >= r.y && mouse.y <= r.y + r.h) {
                        this.hoveredChoice = i;
                    }
                }
            }
            if (this.phase === "idle") {
                const nr = this.NEXT;
                this.nextBtnHovered = (mouse.x >= nr.x && mouse.x <= nr.x + nr.w &&
                    mouse.y >= nr.y && mouse.y <= nr.y + nr.h);
            } else {
                this.nextBtnHovered = false;
            }
        }

        // click handling
        if (click) {
            if (this.phase === "system") {
                // Skip directly to pause
                this.systemLineIndex = this.systemLines.length;
                this.phase = "system_pause";
                this.pauseTimer = 0;
                this.game.click = null;
            } else if (this.phase === "system_pause") {
                this.pauseTimer = 99;
                this.game.click = null;
            } else if (this.phase === "typing") {
                // Skip typing
                this.displayText = this.fullText;
                this.charIndex = this.fullText.length;
                this.phase = this.currentChoices ? "choice" : "idle";
                this.game.click = null;
            } else if (this.phase === "idle") {
                // click anywhere on dialogue box to advance
                const d = this.DLG;
                if (click.x >= d.x && click.x <= d.x + d.w &&
                    click.y >= d.y && click.y <= d.y + d.h) {
                    if (this.nextNodeId) this.loadNode(this.nextNodeId);
                    else this.phase = "end";
                    this.game.click = null;
                }
            } else if (this.phase === "choice" && this.currentChoices) {
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this._choiceRect(i);
                    if (click.x >= r.x && click.x <= r.x + r.w &&
                        click.y >= r.y && click.y <= r.y + r.h) {
                        this.loadNode(this.currentChoices[i].next);
                        this.game.click = null;
                        break;
                    }
                }
            }
        }
    }

    _choiceRect(i) {
        return { x: 75, y: 828 + i * 105, w: 530, h: 88 };
    }

    draw(ctx) {
        const AM = ASSET_MANAGER;
        const W = 1920, H = 1080;

        // background always drawn first
        const bg = AM.getAsset("./assets/DatingGameUI/Background.jpg");
        if (bg) {
            ctx.drawImage(bg, 0, 0, W, H);
        } else {
            ctx.fillStyle = "#fce4f0";
            ctx.fillRect(0, 0, W, H);
        }

        if (this.phase === "system" || this.phase === "system_pause") {
            this._drawSystem(ctx, W, H);
        } else if (this.phase === "end") {
            this._drawEnd(ctx, W, H);
        } else {
            this._drawDialogue(ctx, AM, W, H);
        }

        // fade overlay (fade in/out transitions)
        if (this.fadingIn && this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    _drawSystem(ctx, W, H) {
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = 0.025;
        ctx.fillStyle = "#00ff41";
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
        ctx.restore();

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lh = 66;

        for (let i = 0; i <= Math.min(this.systemLineIndex, this.systemLines.length - 1); i++) {
            const line = this.systemLines[i];
            const isError = line.startsWith("CRITICAL") || line.startsWith("DATABASE");
            const isWarn  = line.startsWith("WARNING") || line === "...";
            ctx.fillStyle    = isError ? "#ff2200" : isWarn ? "#ffaa00" : "#00ff41";
            ctx.shadowColor  = ctx.fillStyle;
            ctx.shadowBlur   = 8;
            ctx.font         = "bold 34px 'Roboto', monospace";
            ctx.fillText(line, 160, 340 + i * lh);
        }

        ctx.shadowBlur = 0;
        ctx.textBaseline = "alphabetic";
    }

    _drawDialogue(ctx, AM) {
        const { x, y, w, h } = this.DLG;

        // dialogue container image
        const dlgImg = AM.getAsset("./assets/DatingGameUI/Dialogue/DialogueContainer.png");
        if (dlgImg) {
            ctx.drawImage(dlgImg, x, y, w, h);
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.93)";
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#e8006f";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, w, h);
        }

        // speaker name
        if (this.currentSpeaker) {
            const speakerColor =
                this.currentSpeaker === "TUTORIAL" ? "#00ccff" :
                    this.currentSpeaker === "SYSTEM"   ? "#ff2200" :
                        this.currentSpeaker === "???"      ? "#aaaaaa" : "#e8006f";

            ctx.textAlign    = "left";
            ctx.textBaseline = "alphabetic";
            ctx.font         = "bold 58px 'The Bold Font', Georgia, serif";
            ctx.fillStyle    = speakerColor;
            ctx.shadowColor  = speakerColor;
            ctx.shadowBlur   = 14;

            // subtle glitch on TUTORIAL name
            let nameDisplay = this.currentSpeaker;
            if (this.currentSpeaker === "TUTORIAL" && Math.random() < 0.018) {
                const glyphs = "!@#$%^&*<>?/|{}~`";
                const idx = Math.floor(Math.random() * nameDisplay.length);
                nameDisplay = nameDisplay.slice(0, idx) +
                    glyphs[Math.floor(Math.random() * glyphs.length)] +
                    nameDisplay.slice(idx + 1);
            }

            ctx.fillText(nameDisplay, x + 30, y - 10);
            ctx.shadowBlur = 0;
        }

        // dialogue text (typed)
        ctx.textAlign    = "left";
        ctx.textBaseline = "top";
        ctx.font         = "bold 34px 'The Bold Font', Georgia, serif";
        ctx.fillStyle    = "#1a1a4e";
        this._wrapText(ctx, this.displayText, x + 44, y + 42, w - 88, 50);
        ctx.textBaseline = "alphabetic";

        // next button (idle phase only)
        if (this.phase === "idle" && this.nextNodeId) {
            const nr   = this.NEXT;
            const nKey = this.nextBtnHovered
                ? "./assets/DatingGameUI/NextBtnPressed.png"
                : "./assets/DatingGameUI/NextBtn.png";
            const nImg = AM.getAsset(nKey);
            if (nImg) ctx.drawImage(nImg, nr.x, nr.y, nr.w, nr.h);
        }

        // choice buttons (choice phase only)
        if (this.phase === "choice" && this.currentChoices) {
            const rKey  = "./assets/DatingGameUI/Dialogue/ReplyBtn.png";
            const rpKey = "./assets/DatingGameUI/Dialogue/ReplyBtnPressed.png";

            for (let i = 0; i < this.currentChoices.length; i++) {
                const r        = this._choiceRect(i);
                const isHov    = i === this.hoveredChoice;
                const btnImg   = AM.getAsset(isHov ? rpKey : rKey);

                if (btnImg) {
                    ctx.drawImage(btnImg, r.x, r.y, r.w, r.h);
                } else {
                    ctx.fillStyle = isHov ? "#d966a0" : "#f0a0cc";
                    ctx.fillRect(r.x, r.y, r.w, r.h);
                }

                ctx.textAlign    = "center";
                ctx.textBaseline = "middle";
                ctx.font         = "bold 28px 'The Bold Font', serif";
                ctx.fillStyle    = "#1a1a4e";
                ctx.fillText(this.currentChoices[i].text.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2);
            }
            ctx.textAlign    = "left";
            ctx.textBaseline = "alphabetic";
        }

        // back arrow (decorative, top-left)
        const backImg = AM.getAsset("./assets/DatingGameUI/Icons/BackArrow.png");
        if (backImg) ctx.drawImage(backImg, 8, 8, 188, 85);
    }

    _drawEnd(ctx, W, H) {
        ctx.fillStyle = "rgba(0,0,0,0.78)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.font         = "bold 56px 'The Bold Font', serif";
        ctx.fillStyle    = "#ffffff";
        ctx.shadowColor  = "#ff69b4";
        ctx.shadowBlur   = 24;
        ctx.shadowBlur   = 0;
        ctx.textAlign    = "left";
        ctx.textBaseline = "alphabetic";
    }

    _wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(" ");
        let line = "";
        let cy   = y;
        for (const word of words) {
            const test = line + word + " ";
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line.trimEnd(), x, cy);
                line = word + " ";
                cy  += lineH;
            } else {
                line = test;
            }
        }
        if (line.trim()) ctx.fillText(line.trimEnd(), x, cy);
    }
}
