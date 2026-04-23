class GlitchIntroScene {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;
        this.timer = 0;
        this.phase = "cute";
        this.glitchStart = 8.0;
        this.glitchEnd = 10.2;
        this.barY = [];
        for (var i = 0; i < 25; i++) {
            this.barY.push(Math.random() * 1080);
        }
        this.notifications = [
            { text: "3 new matches nearby!", y: -60, delay: 0.8, x: 1400 },
            { text: "Someone liked your profile!", y: -60, delay: 1.6, x: 380 },
            { text: "ERROR: match_overflow", y: -60, delay: 2.4, x: 900 },
        ];
        this.notifSoundPlayed = [false, false, false];
        this.shakeX = 0;
        this.shakeY = 0;
    }

    update() {
        var dt = this.game.clockTick;
        this.timer += dt;

        for (var n = 0; n < this.notifications.length; n++) {
            if (!this.notifSoundPlayed[n] && this.timer >= this.notifications[n].delay) {
                this.notifSoundPlayed[n] = true;
                MUSIC.playPopup();
            }
        }

        if (this.game.click && this.timer > 0.5) {
            this.game.click = null;
            this.game.addEntity(new NameInputScene(this.game));
            this.removeFromWorld = true;
            return;
        }

        if (this.timer >= this.glitchStart && this.phase === "cute") {
            this.phase = "glitching";
        }

        if (this.phase === "glitching") {
            var gp = (this.timer - this.glitchStart) / (this.glitchEnd - this.glitchStart);
            var intensity = gp * 16;
            this.shakeX = (Math.random() - 0.5) * intensity;
            this.shakeY = (Math.random() - 0.5) * intensity;
        }

        if (this.timer >= this.glitchEnd) {
            this.game.addEntity(new NameInputScene(this.game));
            this.removeFromWorld = true;
        }
    }

    draw(ctx) {
        var W = 1920, H = 1080;
        var t = this.timer;

        ctx.save();
        if (this.phase === "glitching") {
            ctx.translate(this.shakeX, this.shakeY);
        }

        var bg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Background.jpg");
        if (bg) ctx.drawImage(bg, 0, 0, W, H);

        ctx.globalAlpha = 1;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        var heartImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/PinkHeart.png");
        if (heartImg) {
            var heartScale = 1 + Math.sin(t *3) * 0.08;
            var hw = 200 * heartScale;
            var hh = 200 * heartScale;
            ctx.save();
            ctx.shadowColor = "rgba(215, 72, 134, 0.6)";
            ctx.shadowBlur = 40;
            ctx.drawImage(heartImg, W/2 - hw/2, 200 - hh/2, hw, hh);
            ctx.shadowBlur = 0;
            ctx.restore();


        }


        ctx.font = "bold 82px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#d4457a";
        ctx.shadowColor = "rgba(220, 80, 140, 0.4)";
        ctx.shadowBlur = 16;
        ctx.fillText("PerfectMatch\u2122", W / 2, 490);
        ctx.shadowBlur = 0;

        ctx.font = "italic 30px 'Roboto', sans-serif";
        ctx.fillStyle = "#a04070";
        var loadText = "Finding your soulmate";
        var dotCount = Math.floor(t * 2) % 4;
        for (var d = 0; d < dotCount; d++) loadText += ".";
        ctx.fillText(loadText, W / 2, 570);

       var barEmpty = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeBarEmpty.png");
       var barFill = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeFill.png");
       var barW = 460;
       var barH = 30;
       var barX = W/2 -barW/2;
       var barY = 640;
       var progress = Math.min(t/this.glitchStart,1);
       if (barEmpty) ctx.drawImage(barEmpty, barX, barY, barW, barH);
       if (barFill && progress > 0) {
           ctx.save();
           ctx.beginPath();
           ctx.rect(barX, barY, barW * progress, barH);
           ctx.clip();
           ctx.drawImage(barFill, barX, barY, barW, barH);
           ctx.restore();
       }

        ctx.font = "16px 'Roboto', sans-serif";
        ctx.fillStyle = "#c06090";
        ctx.fillText(Math.floor(progress * 100) + "%  compatibility analysis", W / 2, 680);

        for (var n = 0; n < this.notifications.length; n++) {
            var notif = this.notifications[n];
            if (t < notif.delay) continue;
            var notifAge = t - notif.delay;
            var slideIn = Math.min(1, notifAge * 3);
            var ny = 60 + n * 70;
            ctx.save();
            ctx.globalAlpha = slideIn * 0.9;
            var bubble = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Messaging/MessageBubble.png")
            if (bubble) {
                ctx.drawImage(bubble, notif.x - 190, ny - 5, 380, 62);
            }


            ctx.font = "bold 20px 'Roboto', sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#4a2050";
            ctx.fillText(notif.text, notif.x, ny + 26);
            ctx.restore();
        }
        ctx.font = "18px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(160, 64, 112, 0.5)";
        ctx.fillText("v3.1.4  \u00b7  \u00a9 2026 PerfectMatch Inc.  \u00b7  All rights reserved", W / 2, H - 40);

        if (this.phase === "glitching") {
            var gp = Math.min(1, (t - this.glitchStart) / (this.glitchEnd - this.glitchStart));

            ctx.save();
            ctx.globalAlpha = gp * 0.5;
            for (var i = 0; i < this.barY.length; i++) {
                this.barY[i] += (Math.random() - 0.3) * 50;
                if (this.barY[i] > H) this.barY[i] = 0;
                if (this.barY[i] < 0) this.barY[i] = H;
                var bh = 2 + Math.random() * 10;
                ctx.fillStyle = Math.random() < 0.3 ? "#ff0000"
                    : Math.random() < 0.5 ? "#00ffff" : "#00ff41";
                ctx.fillRect(0, this.barY[i], W, bh);
            }
            ctx.restore();


            if (gp > 0.4) {
                ctx.save();
                ctx.globalAlpha = (gp - 0.4) * 0.6;
                ctx.fillStyle = "#0000A8";
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }

            if (gp > 0.55) {
                ctx.save();
                ctx.globalAlpha = Math.min(1, (gp - 0.55) * 3);
                ctx.font = "bold 34px 'Lucida Console', monospace";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText("*** FATAL ERROR: IDENTITY_DATA_CORRUPT", 90, 160);
                if (gp > 0.7) {
                    ctx.fillText("*** STOP: 0x000000F5 (USER_NOT_FOUND)", 90, 210);
                }
                if (gp > 0.8) {
                    ctx.font = "28px 'Lucida Console', monospace";
                    ctx.fillText("Initializing manual bypass...", 90, 280);
                }
                ctx.restore();
            }

            ctx.fillStyle = `rgba(0,0,0,${Math.pow(gp, 3) * 0.8})`;
            ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
    }
}
