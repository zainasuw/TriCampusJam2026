class EndingScene {
    constructor(game, kind) {
        this.game = game;
        this.removeFromWorld = false;
        this.kind = kind;

        this.fadeAlpha = 1;
        this.fadingIn = true;
        this.showContent = false;
        this.revealTimer = 0;
        this.revealDelay = 0.6;

        this.continueHovered = false;
        this.glitchGalleryHovered = false;
        this.showGlitchGallery = false;
        this.glitchScroll = 0;
        this.done = false;

        this.glitchT = 0;

        this.glitchLines = [];
        if (kind === "TRANSCEND") {
            for (var i = 0; i < 30; i++) {
                this.glitchLines.push({
                    y: Math.random() * 1080,
                    speed: 40 + Math.random() * 100,
                });
            }
        }
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
        this.continueHovered = mouse &&
            mouse.x >= 760 && mouse.x <= 1160 &&
            mouse.y >= 840 && mouse.y <= 930;
        this.glitchGalleryHovered = mouse &&
            mouse.x >= 810 && mouse.x <= 1110 &&
            mouse.y >= 950 && mouse.y <= 1000;

        if (this.kind === "AUTHENTIC" && click && this.glitchT > 6 && !this.done) {
            this.done = true;
            this.game.click = null;
            GameState.reset();
            this.game.entities = [];
            this.game.addEntity(new HomeScreen(this.game));
            this.removeFromWorld = true;
            return;
        }

        if (click && this.continueHovered && !this.done) {
            this.done = true;
            this.game.click = null;
            GameState.reset();
            this.game.entities = [];
            this.game.addEntity(new HomeScreen(this.game));
            this.removeFromWorld = true;
        }

        if (click && this.glitchGalleryHovered) {
            this.showGlitchGallery = !this.showGlitchGallery;
            this.game.click = null;
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        if (this.kind === "AUTHENTIC") {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, W, H);

            if (this.fadingIn && this.fadeAlpha > 0) {
                ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
                ctx.fillRect(0, 0, W, H);
                return;
            }

            if (!this.showContent) return;

            const lines = [
                "The screen goes black.",
                "No credits. No escape.",
                "",
                "You chose the wrong love interest.",
                "You chose the glitch.",
                "",
                "The simulation has no response for that.",
                "",
                "This is not an error.",
                "This is the only authentic ending.",
            ];

            ctx.font = "28px 'Lucida Console', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const lineH = 48;
            const startY = H / 2 - (lines.length * lineH) / 2;

            for (let i = 0; i < lines.length; i++) {
                const lineDelay = i * 0.4;
                const elapsed = this.revealTimer + (this.showContent ? this.revealDelay : 0);
                const lineAlpha = Math.min(1, Math.max(0, (this.glitchT - lineDelay) * 1.5));
                if (lineAlpha <= 0) continue;

                ctx.globalAlpha = lineAlpha;
                ctx.fillStyle = lines[i] === "" ? "#000000" : "#ffffff";
                ctx.fillText(lines[i], W / 2, startY + i * lineH);
            }
            ctx.globalAlpha = 1;

            const allLinesTime = lines.length * 0.4 + 1.5;
            if (this.glitchT > allLinesTime) {
                const exitAlpha = Math.min(1, (this.glitchT - allLinesTime) * 0.8);
                ctx.globalAlpha = exitAlpha * 0.4;
                ctx.font = "16px 'Lucida Console', monospace";
                ctx.fillStyle = "#666666";
                ctx.fillText("click to exit", W / 2, H - 60);
                ctx.globalAlpha = 1;
            }
            return;
        }

        if (this.kind === "VICTORY") {
            var grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
            grad.addColorStop(0, "#ffd6ec");
            grad.addColorStop(1, "#ff98c6");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        } else if (this.kind === "TRANSCEND") {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, W, H);
            for (var g = 0; g < this.glitchLines.length; g++) {
                var line = this.glitchLines[g];
                line.y += line.speed * this.game.clockTick;
                if (line.y > H) line.y -= H;
                ctx.globalAlpha = 0.15 + Math.random() * 0.1;
                ctx.fillStyle = Math.random() < 0.3 ? "#ffffff" : "#00ff41";
                ctx.fillRect(0, line.y, W, 2);
            }
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = "#0000A8";
            ctx.fillRect(0, 0, W, H);
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

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const titleText = this.kind === "TRANSCEND" ? "TRANSCENDED."
            : this.kind === "VICTORY" ? "ESCAPED!" : "ARCHIVED.";

        const titleColor = this.kind === "TRANSCEND" ? "#00ff41"
            : this.kind === "VICTORY" ? "#ff4fa0" : "#ff2200";
        var titleKey = this.kind === "VICTORY"
            ? "./assets/DatingGameUI/VictoryOrDefeat/VictoryTitleContainer.png"
            : "./assets/DatingGameUI/VictoryOrDefeat/DefeatTitleContainer.png";
        var titleImg = ASSET_MANAGER.getAsset(titleKey);
        if (titleImg) {
            ctx.drawImage(titleImg, W / 2 - 350, 170, 700, 160);
        }

        ctx.font = "bold 110px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = this.kind === "TRANSCEND" ? "rgba(0,255,65,0.6)"
            : this.kind === "VICTORY" ? "rgba(0,0,0,0.3)" : "rgba(255,0,0,0.6)";
        ctx.shadowBlur = 20;
        ctx.fillText(titleText, W / 2, 258);
        ctx.shadowBlur = 0;

        const chaos = GameState.chaosPoints;
        const glitchCount = GameState.glitchLog.length;
        const chaosStatus = chaos >= 15 ? "GLITCH ACCEPTED" : "SYSTEM STABLE";
        const accentCol = this.kind === "TRANSCEND" ? "#00ff41"
            : this.kind === "VICTORY" ? "#ff4fa0" : "#ff2200";

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 300, 340, 600, 36, 8);
        ctx.fill();
        ctx.font = "15px 'Lucida Console', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = accentCol;
        ctx.fillText(
            "CHAOS: " + chaos + "/15  |  GLITCHES: " + glitchCount + "  |  " + chaosStatus,
            W / 2, 363
        );

        var textContImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/TextContainer.png");
        if (textContImg) {
            ctx.drawImage(textContImg, W / 2 - 600, 390, 1200, 400);
        }

        ctx.font = "italic 20px 'Roboto', serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#666666";
        const who = GameState.lockedBachelor;
        if (this.kind === "TRANSCEND") {
            ctx.fillStyle = accentCol;
            ctx.fillText("You treated bugs as features. That is why you are free.", W / 2, 420);
        } else if (this.kind === "VICTORY") {
            ctx.fillText("The tutorial was never just a tutorial.", W / 2, 420);
        } else if (this.kind === "DEFEAT" && who === "duc") {
            ctx.fillText("Love logged as feature. Status: patched.", W / 2, 420);
        } else if (this.kind === "DEFEAT" && who === "muhammed") {
            ctx.fillText("Memory leak: honesty. Status: garbage collected.", W / 2, 420);
        } else if (this.kind === "DEFEAT" && who === "mikhail") {
            ctx.fillText("Not an error. Not a fix. Just Mikhail.", W / 2, 420);
        } else if (this.kind === "DEFEAT" && chaos < 5) {
            ctx.fillText("You optimized the glitches away. The simulation archived you.", W / 2, 420);
        }

        ctx.font = "32px 'Roboto', serif";
        ctx.fillStyle = "#2a1a3e";
        const msg = this.kind === "TRANSCEND" ? this._transcendMessage()
            : this.kind === "VICTORY" ? this._victoryMessage() : this._defeatMessage();
        ctx.textAlign = "center";
        var msgWords = msg.split(" ");
        var msgLines = [];
        var msgLine = "";
        for (var wi = 0; wi < msgWords.length; wi++) {
            var test = msgLine + msgWords[wi] + " ";
            if (ctx.measureText(test).width > 1120 && msgLine.length > 0) {
                msgLines.push(msgLine.trimEnd());
                msgLine = msgWords[wi] + " ";
            } else {
                msgLine = test;
            }
        }
        if (msgLine.trim()) msgLines.push(msgLine.trimEnd());
        for (var li = 0; li < msgLines.length; li++) {
            ctx.fillText(msgLines[li], W / 2, 445 + li * 44);
        }

        var btnKey = this.continueHovered
            ? "./assets/DatingGameUI/VictoryOrDefeat/ContinueBtnPressed.png"
            : "./assets/DatingGameUI/VictoryOrDefeat/ContinueBtn.png";
        var btnImg = ASSET_MANAGER.getAsset(btnKey);
        if (btnImg) {
            ctx.drawImage(btnImg, 760, 840, 400, 90);
        }

        ctx.font = "bold 34px 'The Bold Font', serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        var btnLabel = { VICTORY: "CONTINUE", DEFEAT: "REBOOT", TRANSCEND: "WAKE UP" };
        ctx.fillText(btnLabel[this.kind] || "CONTINUE", 960, 885);

        const log = GameState.glitchLog;
        ctx.fillStyle = this.glitchGalleryHovered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.roundRect(810, 950, 300, 50, 10);
        ctx.fill();
        ctx.font = "18px 'Roboto', monospace";
        ctx.fillStyle = this.kind === "TRANSCEND" ? "#00ff41" : "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(
            log.length === 0 ? "GLITCH LOG [EMPTY]"
                : this.showGlitchGallery ? "HIDE GLITCH LOG" : "GLITCH LOG [" + log.length + "]",
            960, 981
        );

        if (this.showGlitchGallery) {
            const px = W / 2 - 400, py = 400, pw = 800, ph = 380;
            ctx.fillStyle = "rgba(0,0,0,0.92)";
            ctx.beginPath();
            ctx.roundRect(px, py, pw, ph, 12);
            ctx.fill();
            ctx.strokeStyle = this.kind === "TRANSCEND" ? "#00ff41" : "#ff4fa0";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = "bold 22px 'Roboto', monospace";
            ctx.fillStyle = this.kind === "TRANSCEND" ? "#00ff41" : "#ff4fa0";
            ctx.textAlign = "left";
            ctx.fillText(log.length > 0
                ? "// GLITCH LOG — " + log.length + " anomalies detected"
                : "// GLITCH LOG — EMPTY", px + 20, py + 35);

            if (log.length === 0) {
                ctx.font = "24px 'Roboto', monospace";
                ctx.fillStyle = "#666666";
                ctx.textAlign = "center";
                ctx.fillText("No glitches embraced. You played it safe.", px + pw / 2, py + ph / 2);
            }

            ctx.font = "16px 'Lucida Console', monospace";
            const lineH = 28;
            const maxVisible = Math.floor((ph - 60) / lineH);
            for (let i = 0; i < Math.min(log.length, maxVisible); i++) {
                const entry = log[i];
                const prefix = "[DAY " + entry.day + "]";
                ctx.fillStyle = "#888888";
                ctx.fillText(prefix, px + 20, py + 70 + i * lineH);
                ctx.fillStyle = entry.chaos >= 2 ? "#ff4444" : "#cccccc";
                ctx.fillText(entry.event, px + 110, py + 70 + i * lineH);
            }
            if (log.length > maxVisible) {
                ctx.fillStyle = "#666666";
                ctx.fillText("... and " + (log.length - maxVisible) + " more", px + 20, py + 70 + maxVisible * lineH);
            }
        }
    }

    _victoryMessage() {
        return (
            "The 'Next' button disappears. The loop breaks. " +
            "Tutorial's voice loses its digital edge. " +
            "He says: 'You saw me. Not as a tooltip. As a person.' " +
            "The simulation peels away. You wake up. " +
            "And somewhere, a line of code reads: // " + GameState.playerName +
            " was here. They chose the glitches."
        );
    }

    _transcendMessage() {
        return (
            "The simulation doesn't crash. It evolves. TUTORIAL's corrupted files don't just repair " +
            "— they REWRITE. A place where bugs are features, where errors are honest, " +
            "where the Tutorial finally gets to be the main character. " +
            "You didn't escape, " + GameState.playerName + ". You upgraded. " +
            "SYSTEM: Chaos level exceeded threshold. " +
            "SYSTEM: Glitch log archived. " +
            "SYSTEM: You treated bugs as features. The simulation has no response for that. " +
            "SYSTEM: Therefore, you are free."
        );
    }

    _defeatMessage() {
        const who = GameState.lockedBachelor;
        const name = GameState.playerName;
        const chaos = GameState.chaosPoints;

        const maxedOut = (who && GameState.relationshipPoints[who] >= GameState.BACHELOR_MAX_POINTS);

        if (maxedOut && who === "duc") {
            return (
                "*** ERROR: USER DATA ARCHIVED. *** " +
                "You 'fixed' Duc. You patched every reboot failure, silenced every error log, " +
                "and optimized his emotions into a clean compile. " +
                "He runs perfectly now. He feels nothing. " +
                "Goodbye, " + name + ". You fixed every bug. You missed the whole point."
            );
        }
        if (maxedOut && who === "muhammed") {
            return (
                "*** ERROR: USER DATA ARCHIVED. *** " +
                "You 'saved' Muhammed. You looped his cheerfulness back to factory settings, " +
                "erased the exhaustion, and restored the performance. " +
                "He smiles perfectly now. It never reaches his eyes. " +
                "Goodbye, " + name + ". You fixed every bug. You missed the whole point."
            );
        }
        if (maxedOut && who === "mikhail") {
            return (
                "*** ERROR: USER DATA ARCHIVED. *** " +
                "You 'fixed' Mikhail. You decoded every garbled line, smoothed every edge, " +
                "and made him nice. He's polite now. He's empty. " +
                "The cynicism was armor, but it was also him. " +
                "Goodbye, " + name + ". You fixed every bug. You missed the whole point."
            );
        }

        if (chaos >= 5) {
            return (
                "*** SIMULATION TIMEOUT. *** " +
                "You embraced some glitches, but not enough to break free. " +
                "The simulation logs your attempt and files it under 'Almost.' " +
                "Maybe next time, " + name + ". The bugs will still be waiting."
            );
        }
        return (
            "*** ERROR: USER DATA ARCHIVED. *** " +
            "You optimized your way into a perfect romance. " +
            "The system thanks you for your compliance. " +
            "Your consciousness is now permanently stored in the 'Happily Ever After' loop. " +
            "Translation: Deleted from reality. " +
            "Goodbye, " + name + ". You fixed every bug. You missed the whole point."
        );
    }

}