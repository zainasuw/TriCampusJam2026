class NameInputScene {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;

        this.playerName = "";
        this.phase = "boot"; // boot -> input -> accepted -> fading
        this.timer = 0;
        this.cursorBlink = 0;
        this.cursorVisible = true;
        this.fadeAlpha = 0;
        this.acceptedTimer = 0;

        this.bootLines = [
            { text: "CRITICAL ERROR: USER_IDENTITY_DATA_CORRUPT", color: "#ff2200", time: 0.4 },
            { text: "DATABASE FAILURE DETECTED.",                 color: "#ff2200", time: 1.1 },
            { text: "ATTEMPTING MANUAL BYPASS...",                color: "#ffaa00", time: 1.9 },
        ];
        this.visibleBootLines = 0;

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
            this.playerName += e.key.toUpperCase();
        }
    }

    update() {
        const dt = this.game.clockTick;
        this.timer += dt;
        this.cursorBlink += dt;

        if (this.cursorBlink >= 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorBlink = 0;
        }

        // reveal boot lines by time
        for (let i = 0; i < this.bootLines.length; i++) {
            if (this.timer >= this.bootLines[i].time) this.visibleBootLines = i + 1;
        }

        // transition boot -> input after last line appears
        if (this.phase === "boot" && this.visibleBootLines >= this.bootLines.length) {
            const lastTime = this.bootLines[this.bootLines.length - 1].time;
            if (this.timer >= lastTime + 0.7) this.phase = "input";
        }

        // accepted -> fading
        if (this.phase === "accepted") {
            this.acceptedTimer += dt;
            if (this.acceptedTimer >= 1.6) this.phase = "fading";
        }

        // fading -> transition to DialogueScene
        if (this.phase === "fading") {
            this.fadeAlpha += dt * 2;
            if (this.fadeAlpha >= 1) {
                document.removeEventListener("keydown", this.keyHandler);
                this.game.addEntity(new DialogueScene(this.game, this.playerName.trim()));
                this.removeFromWorld = true;
            }
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        // scanline effect
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = "#00ff41";
        for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
        ctx.restore();

        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const lx = 160;
        const startY = 310;
        const lh = 66;

        // boot error lines
        for (let i = 0; i < this.visibleBootLines; i++) {
            const line = this.bootLines[i];
            ctx.font = "bold 34px 'Roboto', monospace";
            ctx.fillStyle = line.color;
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 10;
            ctx.fillText(line.text, lx, startY + i * lh);
        }
        ctx.shadowBlur = 0;

        // input prompt and confirmation
        if (this.phase === "input" || this.phase === "accepted" || this.phase === "fading") {
            const py = startY + this.bootLines.length * lh + 48;
            const cursor = (this.phase === "input" && this.cursorVisible) ? "_" : " ";

            ctx.font = "bold 36px 'Roboto', monospace";
            ctx.fillStyle = "#00ff41";
            ctx.shadowColor = "#00ff41";
            ctx.shadowBlur = 8;
            ctx.fillText("INPUT USER DESIGNATION > " + this.playerName + cursor, lx, py);

            if (this.phase === "input") {
                ctx.font = "22px 'Roboto', monospace";
                ctx.fillStyle = "rgba(0,255,65,0.55)";
                ctx.shadowBlur = 0;
                ctx.fillText("[ PRESS ENTER TO CONFIRM ]", lx, py + 54);
            }

            if (this.phase === "accepted" || this.phase === "fading") {
                ctx.font = "bold 34px 'Roboto', monospace";
                ctx.fillStyle = "#00ff41";
                ctx.shadowColor = "#00ff41";
                ctx.shadowBlur = 8;
                ctx.fillText("BYPASS ACCEPTED.", lx, py + lh + 10);
                if (this.acceptedTimer > 0.5 || this.phase === "fading") {
                    ctx.fillText("WELCOME, " + this.playerName + ".", lx, py + lh * 2 + 10);
                }
            }
        }

        ctx.shadowBlur = 0;
        ctx.textBaseline = "alphabetic";

        // fade to black
        if (this.phase === "fading") {
            ctx.fillStyle = `rgba(0,0,0,${Math.min(this.fadeAlpha, 1)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }
}
