// blue screen of death style name input scene
// blue background, white monospaced text, typewriter effect
// then hand off to DialogueScene.

class NameInputScene {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;

        this.playerName = "";
        // phase: "typing_boot" -> "await_input" -> "input" -> "accepted" -> "fading"
        this.phase = "typing_boot";
        this.fadeAlpha = 0;
        this.acceptedTimer = 0;
        this.cursorBlink = 0;
        this.cursorVisible = true;

        // full BSOD text. Kept short and thematic (not real MS BSOD wall of text).
        // Each entry is a paragraph; rendered with word-wrap.
        this.bsodParagraphs = [
            "A problem has been detected and the simulation has been halted to prevent further data corruption.",
            "",
            "USER_IDENTITY_DATA_CORRUPT",
            "",
            "If this is the first time you have seen this stop error screen, the manual bypass protocol will attempt to restore your designation. Do not restart your device.",
            "",
            "Technical information:",
            "",
            "*** STOP: 0x000000F5 (0xBIGB00B5, 0x00008079, 0x53110000, 0x69696969)",
            "",
            "Initializing identity bypass; awaiting user input.",
        ];

        // typewriter state for the whole block
        this.fullText = this.bsodParagraphs.join("\n");
        this.typedChars = 0;
        this.charsPerSec = 180;        // fast terminal typing
        this.typingAccum = 0;

        // after text finishes typing, wait a beat before showing input prompt
        this.postTypePause = 0;
        this.postTypeDelay = 0.35;

        // BSOD styling constants (classic NT 4.0 / XP palette)
        this.BG_COLOR   = "#f7c5d5";   // iconic BSOD pink
        this.FG_COLOR   = "#3d1a2e";
        this.FONT_BODY  = "32px 'Lucida Console', 'Consolas', 'Courier New', monospace";
        this.FONT_HEAD  = "bold 34px 'Lucida Console', 'Consolas', 'Courier New', monospace";

        // layout
        this.MARGIN_X  = 90;
        this.START_Y   = 90;
        this.LINE_H    = 42;
        this.MAX_W     = 1740;   // canvas is 1920 wide

        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        // start typing SFX loop. it will be stopped the moment the typewriter finishes, or user skips with a click
        MUSIC.startTyping();
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
            // accept letters, numbers, space. Uppercase to match BSOD aesthetic.
            if (/^[A-Za-z0-9 ]$/.test(e.key)) {
                this.playerName += e.key.toUpperCase();
            }
        }
    }

    update() {
        const dt = this.game.clockTick;
        this.cursorBlink += dt;
        if (this.cursorBlink >= 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorBlink = 0;
        }

        // typewriter boot
        if (this.phase === "typing_boot") {
            // click to skip
            if (this.game.click) {
                
                this.typedChars = this.fullText.length;
                this.game.click = null;
            }

            this.typingAccum += dt * this.charsPerSec;
            while (this.typingAccum >= 1 && this.typedChars < this.fullText.length) {
                this.typingAccum -= 1;
                this.typedChars++;
            }
            if (this.typedChars >= this.fullText.length) {
                this.phase = "await_input";
                this.postTypePause = 0;
                // Typewriter is done — kill the typing SFX loop.
                MUSIC.stopTyping();
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
                MUSIC.stopTyping(); // safety: make sure it's off before leaving
                
                MUSIC.playGameMusic();
                
                GameState.playerName = this.playerName.trim() || "USER";
                this.game.addEntity(new DialogueScene(this.game, "tutorial_intro_1"));
                this.removeFromWorld = true;
            }
        }
    }

    // wordwrap a string honoring \n breaks
    _wrappedLines(ctx, text, maxW) {
        const paragraphs = text.split("\n");
        const lines = [];
        for (const para of paragraphs) {
            if (para === "") { lines.push(""); continue; }
            const words = para.split(" ");
            let line = "";
            for (const w of words) {
                const test = line.length ? line + " " + w : w;
                if (ctx.measureText(test).width > maxW && line.length > 0) {
                    lines.push(line);
                    line = w;
                } else {
                    line = test;
                }
            }
            if (line.length) lines.push(line);
        }
        return lines;
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // Solid BSOD blue
        ctx.fillStyle = this.BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = this.FG_COLOR;
        ctx.font = this.FONT_BODY;

        // figure out what portion of fullText to render
        const visible = this.fullText.slice(0, this.typedChars);

        const allLines = this._wrappedLines(ctx, this.fullText, this.MAX_W);

        let remaining = visible.length;
        let y = this.START_Y;
        const cursor = this.cursorVisible ? "_" : " ";

        for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i];
            if (line === "") {
                if (remaining > 0) remaining -= 1;
                y += this.LINE_H;
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
                if (toDraw.startsWith("*** STOP") || toDraw.startsWith("USER_IDENTITY")) {
                    ctx.font = this.FONT_HEAD;
                } else {
                    ctx.font = this.FONT_BODY;
                }
                ctx.fillText(toDraw, this.MARGIN_X, y);
            }
            y += this.LINE_H;
            if (remaining <= 0 && this.phase === "typing_boot") {
                // draw the typing cursor at end of visible content
                const w = ctx.measureText(toDraw).width;
                ctx.fillText(cursor, this.MARGIN_X + w + 2, y - this.LINE_H);
                break;
            }
        }

        // input prompt
        if (this.phase === "input" || this.phase === "accepted" || this.phase === "fading") {
            const py = y + 28;
            ctx.font = this.FONT_HEAD;
            ctx.fillStyle = this.FG_COLOR;
            const nameCursor = (this.phase === "input" && this.cursorVisible) ? "_" : " ";
            ctx.fillText("> ENTER USER DESIGNATION: " + this.playerName + nameCursor, this.MARGIN_X, py);

            if (this.phase === "input") {
                ctx.font = this.FONT_BODY;
                ctx.fillText("[ Press ENTER to confirm ]", this.MARGIN_X, py + this.LINE_H + 6);
            }

            if (this.phase === "accepted" || this.phase === "fading") {
                ctx.fillText("BYPASS ACCEPTED.", this.MARGIN_X, py + this.LINE_H);
                if (this.acceptedTimer > 0.5 || this.phase === "fading") {
                    ctx.fillText("WELCOME, " + this.playerName + ".", this.MARGIN_X, py + this.LINE_H * 2);
                }
            }
        }

        // fade to black before handing off
        if (this.phase === "fading") {
            ctx.fillStyle = `rgba(0,0,0,${Math.min(this.fadeAlpha, 1)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
}