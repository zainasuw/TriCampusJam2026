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
        this.holdDuration = 0.6;
        this.fadeOut = 0;

        const chaos = GameState.chaosPoints;
        const day = String(GameState.currentDay).padStart(3, "0");
        const bsod = this._pickBSOD(chaos, day);

        this.paragraphs = [
            bsod.header,
            "",
            "INCREMENTING DAY COUNTER... " + (GameState.currentDay - 1) + " -> " + GameState.currentDay,
            "",
            bsod.detail,
            "",
            "Technical information:",
            "",
            bsod.stopCode,
            "",
            bsod.status,
        ];

        this.fullText = this.paragraphs.join("\n");
        this.typedChars = 0;
        this.charsPerSec = 350;
        this.typingAccum = 0;

        this.BG_COLOR   = "#d4789a";
        this.FG_COLOR   = "#3d1a2e";

        // hearts show up and die if ur getting too close to a bachelor
        var maxPts = Math.max(
            GameState.relationshipPoints.duc,
            GameState.relationshipPoints.muhammed,
            GameState.relationshipPoints.mikhail
        );
        this.activeVFX = [];
        if (maxPts >= 25) {
            // critical danger: burning hearts
            this._queueVFX("./assets/vfx/burning_heart.png", 5, 4, 20, 300, 400, 0.3);
            this._queueVFX("./assets/vfx/burning_heart.png", 5, 4, 20, 1600, 500, 0.8);
            this._queueVFX("./assets/vfx/distorted_heart.png", 5, 4, 20, 950, 300, 1.2);
        } else if (maxPts >= 12) {
            // mild danger: a heart crumbles
            this._queueVFX("./assets/vfx/heart_crumble.png", 5, 3, 15, 1650, 450, 0.5);
        }
        this.FONT_BODY  = "32px 'Lucida Console', 'Consolas', 'Courier New', monospace";
        this.FONT_HEAD  = "bold 34px 'Lucida Console', 'Consolas', 'Courier New', monospace";

        this.MARGIN_X  = 90;
        this.START_Y   = 140;
        this.LINE_H    = 42;
        this.MAX_W     = 1740;

        this.cursorBlink = 0;
        this.cursorVisible = true;

        // typing SFX while the BSOD types itself out
        //MUSIC.startTyping();
    }

    update() {
        const dt = this.game.clockTick;

        // typing BSOD sound starts on the first update to sync better with the text appearing, 
        // and to avoid starting if the scene is skipped
        if (!this._typingStarted) {
            this._typingStarted = true;
            MUSIC.startTyping();
        }

        // tick vfx
        for (var v = this.activeVFX.length - 1; v >= 0; v--) {
            var fx = this.activeVFX[v];
            if (!fx.started) { fx.delay -= dt; if (fx.delay <= 0) fx.started = true; continue; }
            fx.timer += dt;
            if (fx.timer >= 1 / 15) { fx.timer -= 1 / 15; fx.frame++; if (fx.frame >= fx.total) this.activeVFX.splice(v, 1); }
        }

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

    _queueVFX(asset, cols, rows, total, x, y, delay) {
        this.activeVFX.push({ asset, cols, rows, total, x, y, delay: delay || 0, frame: 0, timer: 0, started: false });
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

        // danger hearts
        for (var v = 0; v < this.activeVFX.length; v++) {
            var fx = this.activeVFX[v];
            if (!fx.started) continue;
            var img = ASSET_MANAGER.getAsset(fx.asset);
            if (!img) continue;
            var fw = img.width / fx.cols;
            var fh = img.height / fx.rows;
            var sx = (fx.frame % fx.cols) * fw;
            var sy = Math.floor(fx.frame / fx.cols) * fh;
            ctx.drawImage(img, sx, sy, fw, fh, fx.x - fw, fx.y - fh, fw * 2, fh * 2);
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