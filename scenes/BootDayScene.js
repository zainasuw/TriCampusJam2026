// BSOD boot transition scene. Used between days to reinforce the "simulation
// crashing and rebooting vibe. Typewriter effect, then auto-advances to the

class BootDayScene {
    constructor(game, nextNodeId) {
        this.game = game;
        this.removeFromWorld = false;
        this.nextNodeId = nextNodeId || "tutorial_morning";

        this.fadeAlpha = 1;
        this.fadingIn = true;
        this.phase = "typing";
        this.holdTimer = 0;
        this.holdDuration = 1.2;
        this.fadeOut = 0;

        this.paragraphs = [
            "A problem has been detected; the simulation has advanced the day counter.",
            "",
            "DAY_COUNTER_INCREMENT",
            "",
            "If this is not the first time you have seen this screen, " +
            "the previous instance has been archived and a new day has been initialized.",
            "",
            "Technical information:",
            "",
            `*** STOP: 0x000000F5 (DAY ${String(GameState.currentDay).padStart(3, "0")})`,
            "",
            "Loading next cycle...",
        ];

        this.fullText = this.paragraphs.join("\n");
        this.typedChars = 0;
        this.charsPerSec = 220;
        this.typingAccum = 0;

        this.BG_COLOR   = "#0000A8";
        this.FG_COLOR   = "#FFFFFF";
        this.FONT_BODY  = "32px 'Lucida Console', 'Consolas', 'Courier New', monospace";
        this.FONT_HEAD  = "bold 34px 'Lucida Console', 'Consolas', 'Courier New', monospace";

        this.MARGIN_X  = 90;
        this.START_Y   = 140;
        this.LINE_H    = 42;
        this.MAX_W     = 1740;

        this.cursorBlink = 0;
        this.cursorVisible = true;

        // typing SFX while the BSOD types itself out
        MUSIC.startTyping();
    }

    update() {
        const dt = this.game.clockTick;
        this.cursorBlink += dt;
        if (this.cursorBlink >= 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorBlink = 0;
        }

        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.8);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
        }

        if (this.game.click && this.phase === "typing") {
            
            this.typedChars = this.fullText.length;
            this.game.click = null;
        }

        if (this.phase === "typing") {
            this.typingAccum += dt * this.charsPerSec;
            while (this.typingAccum >= 1 && this.typedChars < this.fullText.length) {
                this.typingAccum -= 1;
                this.typedChars++;
            }
            if (this.typedChars >= this.fullText.length) {
                this.phase = "hold";
                MUSIC.stopTyping();
            }
        } else if (this.phase === "hold") {
            this.holdTimer += dt;
            if (this.holdTimer >= this.holdDuration || this.game.click) {
                if (this.game.click) 
                this.game.click = null;
                this.phase = "fading_out";
            }
        } else if (this.phase === "fading_out") {
            this.fadeOut += dt * 1.8;
            if (this.fadeOut >= 1) {
                MUSIC.stopTyping(); // safety
                this.game.addEntity(new DialogueScene(this.game, this.nextNodeId));
                this.removeFromWorld = true;
            }
        }
    }

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
        ctx.fillStyle = this.BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = this.FG_COLOR;
        ctx.font = this.FONT_BODY;

        const allLines = this._wrappedLines(ctx, this.fullText, this.MAX_W);
        let remaining = this.typedChars;
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
                ctx.font = (toDraw.startsWith("*** STOP") || toDraw.startsWith("DAY_COUNTER"))
                    ? this.FONT_HEAD : this.FONT_BODY;
                ctx.fillText(toDraw, this.MARGIN_X, y);
            }
            y += this.LINE_H;
            if (remaining <= 0 && this.phase === "typing") {
                const w = ctx.measureText(toDraw).width;
                ctx.fillText(cursor, this.MARGIN_X + w + 2, y - this.LINE_H);
                break;
            }
        }

        // Fade overlays
        if (this.fadingIn && this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (this.phase === "fading_out") {
            ctx.fillStyle = `rgba(0,0,0,${Math.min(this.fadeOut, 1)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
}