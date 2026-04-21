class NameInputScene {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;

        this.playerName = "";
        this.phase = "typing_boot";
        this.fadeAlpha = 0;
        this.acceptedTimer = 0;
        this.cursorBlink = 0;
        this.cursorVisible = true;

        this.bsodParagraphs = [
            "A problem has been detected and the simulation has been halted to prevent further data corruption.",
            "",
            "USER_IDENTITY_DATA_CORRUPT",
            "",
            "If this is the first time you've seen this stop error screen,",
            "the manual bypass protocol will attempt to restore your designation.",
            "",
            "Technical information:",
            "",
            "*** STOP: 0x000000F5 (0xBIGB00B5, 0x00008079, 0x53110000, 0x69696969)",
            "",
            "SYSTEM: Glitch status: FEATURE.",
            "Initializing identity bypass; awaiting user input.",
        ];

        this.fullText = this.bsodParagraphs.join("\n");
        this.charIdx = 0;
        this.speed = 180;
        this.acc = 0;

        this.postTypePause = 0;
        this.postTypeDelay = 0.35;

        this.BG_COLOR = "#1A0000";
        this.FG_COLOR = "#FFFFFF";
        this.FONT_BODY = "32px 'Lucida Console', 'Consolas', 'Courier New', monospace";
        this.FONT_HEAD = "bold 34px 'Lucida Console', 'Consolas', 'Courier New', monospace";

        this.marginX = 90;
        this.startY = 90;
        this.lineH = 42;
        this.maxW = 1740;

        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);
    }

    _onKey(e) {
        if (this.phase !== "input") return;
        if (e.key === "Enter") {
            if (this.playerName.trim().length > 0) {
                this.phase = "accepted";
                this.acceptedTimer = 0;
            }
        } else if (e.key === "Backspace") {
            e.preventDefault();
            this.playerName = this.playerName.slice(0, -1);
        } else if (e.key.length === 1 && this.playerName.length < 18) {
            var ch = e.key;
            var code = ch.charCodeAt(0);
            var ok = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
                || (code >= 48 && code <= 57) || ch === " ";
            if (ok) this.playerName += ch.toUpperCase();
        }
    }

    update() {
        const dt = this.game.clockTick;
        this.cursorBlink += dt;
        if (this.cursorBlink >= 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorBlink = 0;
        }

        if (this.phase === "typing_boot") {
            if (this.game.click) {
                this.charIdx = this.fullText.length;
                this.game.click = null;
            }
            this.acc += dt * this.speed;
            while (this.acc >= 1 && this.charIdx < this.fullText.length) {
                this.acc -= 1;
                this.charIdx++;
            }
            if (this.charIdx >= this.fullText.length) {
                this.phase = "await_input";
                this.postTypePause = 0;
            }
        } else if (this.phase === "await_input") {
            this.postTypePause += dt;
            if (this.postTypePause >= this.postTypeDelay) {
                this.phase = "input";
            }
        } else if (this.phase === "accepted") {
            this.acceptedTimer += dt;
            if (this.acceptedTimer >= 1.4) this.phase = "fading";
        } else if (this.phase === "fading") {
            this.fadeAlpha += dt * 2;
            if (this.fadeAlpha >= 1) {
                document.removeEventListener("keydown", this.keyHandler);
                GameState.playerName = this.playerName.trim() || "USER";
                this.game.addEntity(new DialogueScene(this.game, "tutorial_intro_1"));
                this.removeFromWorld = true;
            }
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        ctx.fillStyle = this.BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = this.FG_COLOR;
        ctx.font = this.FONT_BODY;

        const allLines = getWrappedLines(ctx, this.fullText, this.maxW);
        let remaining = this.charIdx;
        let y = this.startY;
        const cursor = this.cursorVisible ? "_" : " ";

        for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i];
            if (line === "") {
                if (remaining > 0) remaining -= 1;
                y += this.lineH;
                continue;
            }
            let toDraw;
            if (remaining >= line.length) {
                toDraw = line;
                remaining -= line.length;
                if (i < allLines.length - 1) remaining -= 1;
            } else if (remaining > 0) {
                toDraw = line.slice(0, remaining);
                remaining = 0;
            } else {
                toDraw = "";
            }
            if (toDraw.length > 0) {
                if (toDraw.startsWith("*** STOP") || toDraw.startsWith("USER_IDENTITY") || toDraw.startsWith("SYSTEM:")) {
                    ctx.font = this.FONT_HEAD;
                } else {
                    ctx.font = this.FONT_BODY;
                }
                ctx.fillText(toDraw, this.marginX, y);
            }
            y += this.lineH;
            if (remaining <= 0 && this.phase === "typing_boot") {
                const w = ctx.measureText(toDraw).width;
                ctx.fillText(cursor, this.marginX + w + 2, y - this.lineH);
                break;
            }
        }

        if (this.phase === "input" || this.phase === "accepted" || this.phase === "fading") {
            const py = y + 28;
            ctx.font = this.FONT_HEAD;
            ctx.fillStyle = this.FG_COLOR;
            const nameCursor = (this.phase === "input" && this.cursorVisible) ? "_" : " ";
            ctx.fillText("> ENTER USER DESIGNATION: " + this.playerName + nameCursor, this.marginX, py);

            if (this.phase === "input") {
                ctx.font = this.FONT_BODY;
                ctx.fillText("[ Press ENTER to confirm ]", this.marginX, py + this.lineH + 6);
            }

            if (this.phase === "accepted" || this.phase === "fading") {
                ctx.fillText("BYPASS ACCEPTED.", this.marginX, py + this.lineH);
                if (this.acceptedTimer > 0.5 || this.phase === "fading") {
                    ctx.fillText("WELCOME, " + this.playerName + ".", this.marginX, py + this.lineH * 2);
                }
            }
        }

        if (this.phase === "fading") {
            ctx.fillStyle = `rgba(0,0,0,${Math.min(this.fadeAlpha, 1)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
}
