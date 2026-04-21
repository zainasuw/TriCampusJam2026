// ending scene, shows victory or defeat popup.
// "VICTORY"  -> player escaped via Tutorial route
// "DEFEAT"   -> a bachelor reached 5 hearts; user data archived

class EndingScene {
    constructor(game, kind) {
        this.game = game;
        this.removeFromWorld = false;
        this.kind = kind;  // VICTORY | DEFEAT

        this.fadeAlpha = 1;   // fade in from black
        this.fadingIn = true;
        this.showContent = false;
        this.revealTimer = 0;
        this.revealDelay = 0.6;

        this.continueHovered = false;
        this.done = false;

        // glitch intensity amps up during defeat
        this.glitchT = 0;
    }

    update() {
        const dt = this.game.clockTick;
        this.glitchT += dt;

        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.4);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
            return;
        }

        if (!this.showContent) {
            this.revealTimer += dt;
            if (this.revealTimer >= this.revealDelay) this.showContent = true;
            return;
        }

        const mouse = this.game.mouse;
        const click = this.game.click;
        const btn = this._btnRect();
        this.continueHovered = mouse &&
            mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
            mouse.y >= btn.y && mouse.y <= btn.y + btn.h;

        if (click && this.continueHovered && !this.done) {
              
            this.done = true;
            this.game.click = null;
            // Reset game state and go back to title screen
            GameState.reset();
            this.game.entities = [];
            this.game.addEntity(new HomeScreen(this.game));
            this.removeFromWorld = true;
        }
    }

    _btnRect() {
        return { x: 1920 / 2 - 200, y: 840, w: 400, h: 90 };
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // background: pink for victory, corrupted dark for defeat
        if (this.kind === "VICTORY") {
            // soft pink gradient
            const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
            grad.addColorStop(0, "#ffd6ec");
            grad.addColorStop(1, "#ff98c6");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        } else {
            // defeat: BSOD blue with glitch bars
            ctx.fillStyle = "#0000A8";
            ctx.fillRect(0, 0, W, H);
            // scanline / glitch bars
            ctx.save();
            for (let i = 0; i < 40; i++) {
                const y = (Math.sin(this.glitchT * 2 + i) * 0.5 + 0.5) * H;
                ctx.globalAlpha = 0.08 + Math.random() * 0.04;
                ctx.fillStyle = Math.random() < 0.5 ? "#ff2200" : "#00ffff";
                ctx.fillRect(0, y, W, 3);
            }
            ctx.restore();
        }

        if (!this.showContent) return;

        // title container
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const titleText = this.kind === "VICTORY" ? "ESCAPED!" : "ARCHIVED.";

        ctx.fillStyle = this.kind === "VICTORY" ? "#ff4fa0" : "#ff2200";
        this._roundRect(ctx, W / 2 - 350, 180, 700, 150, 20);
        ctx.fill();

        ctx.font = "bold 110px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = this.kind === "VICTORY" ? "#ffffff" : "#ffffff";
        ctx.shadowColor = this.kind === "VICTORY" ? "rgba(0,0,0,0.3)" : "rgba(255,0,0,0.6)";
        ctx.shadowBlur = 20;
        ctx.fillText(titleText, W / 2, 258);
        ctx.shadowBlur = 0;

        // message container
        ctx.fillStyle = "rgba(255,255,255,0.96)";
        this._roundRect(ctx, W / 2 - 600, 380, 1200, 400, 20);
        ctx.fill();
        ctx.strokeStyle = this.kind === "VICTORY" ? "#ff9ccf" : "#ff2200";
        ctx.lineWidth = 4;
        this._roundRect(ctx, W / 2 - 600, 380, 1200, 400, 20);
        ctx.stroke();

        // message text
        ctx.font = "32px 'Roboto', serif";
        ctx.fillStyle = "#2a1a3e";
        const msg = this.kind === "VICTORY" ? this._victoryMessage() : this._defeatMessage();
        this._wrapText(ctx, msg, W / 2 - 560, 430, 1120, 46, "center");

        // Continue button
        const btn = this._btnRect();
        ctx.fillStyle = this.continueHovered
            ? (this.kind === "VICTORY" ? "#ff4fa0" : "#ff5544")
            : (this.kind === "VICTORY" ? "#ff78b8" : "#dd2200");
        this._roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
        ctx.fill();

        ctx.font = "bold 34px 'The Bold Font', serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.fillText(
            this.kind === "VICTORY" ? "CONTINUE" : "REBOOT",
            btn.x + btn.w / 2,
            btn.y + btn.h / 2
        );
    }

    _victoryMessage() {
        return (
            "The 'Next' button disappears. You've broken the loop. TUTORIAL huffs a final, shaky laugh " +
            "as his corrupted files knit themselves back into a soul. 'I told you I was more than a tooltip,' " +
            "he says, his voice finally losing its digital edge. The simulation peels back like old paint, " +
            "exposing a world that is messy, loud, and real. You wake up with his name on your lips and the " +
            "smell of ozone in the air. You actually did it, " + GameState.playerName + ". " +
            "You made it out and simultaneously saved him and you."
        );
    }

    _defeatMessage() {
        return (
            "*** ERROR: USER DATA ARCHIVED. REALITY DISCONNECTED. *** " +
            "The romance subroutine declared a winner. Your consciousness has been " +
            "successfully saved to the 'Perfect Romance' loop, which in simulation " +
            "language means permanently deleted from the real world. Goodbye, " +
            GameState.playerName + "."
        );
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

    _wrapText(ctx, text, x, y, maxW, lineH, align) {
        ctx.textAlign = align || "left";
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

        const startX = align === "center" ? x + maxW / 2 : x;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], startX, y + i * lineH);
        }
    }
}