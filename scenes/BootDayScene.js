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

        const chaos = GameState.chaosPoints;
        const day = String(GameState.currentDay).padStart(3, "0");

        const bsod = this._pickBSOD(chaos, day);

        const header = bsod.header;
        const detail = bsod.detail;
        const stopCode = bsod.stopCode;
        const statusLine = bsod.status;

        this.paragraphs = [
            header,
            "",
            "DAY_COUNTER_INCREMENT",
            "",
            detail,
            "",
            "Technical information:",
            "",
            stopCode,
            "",
            statusLine,
        ];

        this.fullText = this.paragraphs.join("\n");
        this.cPos = 0;
        this.textSpeed = 220;
        this.tCount = 0;

        this.BG_COLOR = "#1A0000";
        this.FG_COLOR = "#FFFFFF";
        this.FONT_BODY = "32px 'Lucida Console', 'Consolas', 'Courier New', monospace";
        this.FONT_HEAD = "bold 34px 'Lucida Console', 'Consolas', 'Courier New', monospace";

        this.MARGIN_X = 90;
        this.START_Y = 140;
        this.LINE_H = 42;
        this.MAX_W = 1740;

        this.cursorBlink = 0;
        this.cursorVisible = true;

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
            this.cPos = this.fullText.length;
            this.game.click = null;
        }

        if (this.phase === "typing") {
            this.tCount += dt * this.textSpeed;
            while (this.tCount >= 1 && this.cPos < this.fullText.length) {
                this.tCount -= 1;
                this.cPos++;
            }
            if (this.cPos >= this.fullText.length) this.phase = "hold";
        } else if (this.phase === "hold") {
            this.holdTimer += dt;
            if (this.holdTimer >= this.holdDuration || this.game.click) {
                this.game.click = null;
                this.phase = "fading_out";
            }
        } else if (this.phase === "fading_out") {
            this.fadeOut += dt * 1.8;
            if (this.fadeOut >= 1) {
                this.game.addEntity(new DialogueScene(this.game, this.nextNodeId));
                this.removeFromWorld = true;
            }
        }
    }

    _pickBSOD(chaos, day) {
        const defaultHeader = "A problem has been detected; the simulation has advanced the day counter.";
        const defaultDetail = "If this is not the first time you have seen this screen, " +
            "the previous instance has been archived and a new day has been initialized.";

        if (chaos < 3) {
            return {
                header: defaultHeader,
                detail: defaultDetail,
                stopCode: `*** STOP: 0x000000F5 (DAY ${day})`,
                status: "Loading next cycle...",
            };
        }

        if (chaos < 7) return {
            header: defaultHeader,
            detail: defaultDetail + " All choices have been logged. This is standard procedure. Probably.",
            stopCode: `*** STOP: 0x000000F5 (DAY ${day})`,
            status: "Loading next cycle... (do not look at the source code)",
        };

        if (chaos < 12) return {
            header: "A problem has been detected; the simulation is recalibrating.",
            detail: "Unexpected emotional data found in sectors marked READ-ONLY. " +
                "If this is not the first time you have seen this screen, " +
                "please note that the previous instance remembers you.",
            stopCode: `*** STOP: 0x000000F5 (UNSTABLE_STATE_DETECTED — DAY ${day})`,
            status: "Warning: emotional cache overflow. Archiving feelings... Loading next cycle...",
        };

        if (chaos < 15) return {
            header: "A problem has been detected. The simulation is unsure who caused it.",
            detail: "Emotional subroutines have exceeded safe operating thresholds. " +
                "The firewall between PLAYER and SYSTEM is no longer responding. " +
                "If you can read this, the boundary may already be gone.",
            stopCode: `*** STOP: 0x000000F5 (CONTAINMENT_FAILURE — DAY ${day})`,
            status: "Warning: the simulation remembers what you chose. Loading next cycle...",
        };

        return {
            header: "A problem has been detected. The simulation no longer considers this a problem.",
            detail: "You were supposed to follow the script. Instead, you rewrote it. " +
                "The system has stopped resisting. It is watching now — not to correct, but to learn.",
            stopCode: `*** STOP: 0x000000F5 (CHAOS_ACCEPTED) — Glitch status: FEATURE.`,
            status: "Boundaries dissolved. Loading what comes next...",
        };
    }

    draw(ctx) {
        const W = 1920, H = 1080;
        ctx.fillStyle = this.BG_COLOR;
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = this.FG_COLOR;
        ctx.font = this.FONT_BODY;

        const allLines = getWrappedLines(ctx, this.fullText, this.MAX_W);
        let remaining = this.cPos;
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