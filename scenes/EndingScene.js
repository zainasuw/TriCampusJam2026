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
        this.soundPlayed = false;
        this.continueHovered = false;
        this.done = false;

        // glitch intensity amps up during defeat
        this.glitchT = 0;

        // TRANSCEND scrolling glitch lines
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
            if (this.revealTimer >= this.revealDelay) {
                this.showContent = true;
                if (!this.soundPlayed) {
                    this.soundPlayed = true;
                    if (this.kind === "VICTORY" || this.kind === "TRANSCEND") {
                        MUSIC.playWin();
                    } else {
                        MUSIC.playLose();
                    }
                }
            }
        }

        const mouse = this.game.mouse;
        const click = this.game.click;
        const btn = this._btnRect();
        this.continueHovered = mouse &&
            mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
            mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
        // AUTHENTIC: click anywhere after text finishes to exit
        if (this.kind === "AUTHENTIC" && click && this.glitchT > 6 && !this.done) {
            this.done = true;
            this.game.click = null;
            GameState.reset();
            for (var e of this.game.entities) e.removeFromWorld = true;
            this.game.addEntity(new HomeScreen(this.game));
            return;
        }

        if (click && this.continueHovered && !this.done) {
            this.done = true;
            this.game.click = null;
            GameState.reset();
            for (var e of this.game.entities) e.removeFromWorld = true;
            this.game.addEntity(new HomeScreen(this.game));
        }
    }

    _btnRect() {
        return { x: 1920 / 2 - 200, y: 840, w: 400, h: 90 };
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // ── AUTHENTIC ending: black screen with slow-reveal text ──
        if (this.kind === "AUTHENTIC") {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, W, H);
            if (this.fadingIn && this.fadeAlpha > 0) {
                ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
                ctx.fillRect(0, 0, W, H);
                return;
            }
            if (!this.showContent) return;
            const pts = GameState.relationshipPoints;
            const visited = ["duc", "muhammed", "mikhail"].filter(n => pts[n] > 0).length;
            const lines = visited >= 3 ? [
                "The screen goes black.",
                "No winner. No loser.",
                "",
                "You talked to everyone.",
                "You didn't pick a favourite.",
                "",
                "The simulation doesn't know what to do with that.",
                "",
                "Maybe that was the point.",
                "Maybe you were never supposed to choose.",
            ] : [
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
                const lineAlpha = Math.min(1, Math.max(0, (this.glitchT - i * 0.4) * 1.5));
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

        // ── Backgrounds ──
        if (this.kind === "VICTORY") {
            var bg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Background.jpg");
            if (bg) ctx.drawImage(bg, 0,0,W,H);

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
            // defeat: BSOD blue with glitch bars
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

        // title container
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const titleText = this.kind === "VICTORY" ? "ESCAPED!"
            : this.kind === "TRANSCEND" ? "TRANSCENDED." : "ARCHIVED.";

        var titleAsset = this.kind === "VICTORY"
            ? ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/VictoryTitleContainer.png")
            : ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/DefeatTitleContainer.png");
        if (titleAsset) {
            ctx.drawImage(titleAsset, W / 2 - 350, 180, 700, 150);
        }


        ctx.font = "bold 110px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = this.kind === "VICTORY" ? "rgba(0,0,0,0.3)"
            : this.kind === "TRANSCEND" ? "rgba(0,255,65,0.6)" : "rgba(255,0,0,0.6)";
        ctx.shadowBlur = 20;
        ctx.fillText(titleText, W / 2, 258);
        ctx.shadowBlur = 0;

        // chaos status bar (only for DEFEAT / TRANSCEND)
        if (this.kind !== "VICTORY") {
            ctx.font = "18px 'Lucida Console', monospace";
            ctx.fillStyle = this.kind === "TRANSCEND" ? "#00ff41" : "#ff4444";
            ctx.globalAlpha = 0.7;
            ctx.fillText("CHAOS LEVEL: " + GameState.chaosPoints, W / 2, 340);
            ctx.globalAlpha = 1;
        }

        var textBox = ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/TextContainer.png");
        if (textBox) {
            ctx.drawImage(textBox, W / 2 - 600, 380, 1200, 400);
        }

        // message text
        ctx.font = "32px 'Roboto', serif";
        ctx.fillStyle = "#2a1a3e";
        const msg = this.kind === "TRANSCEND" ? this._transcendMessage()
            : this.kind === "VICTORY" ? this._victoryMessage() : this._defeatMessage();
        this.wrapText(ctx, msg, W / 2 - 560, 445, 1120, 44, "center");

        // Continue button
        const btn = this._btnRect();
        var btnImg;
        if (this.kind === "VICTORY") {
            btnImg = this.continueHovered
                ? ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtnPressed.png")
                : ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtn.png");
        } else {
            btnImg = this.continueHovered
                ? ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/RedBtnPressed.png")
                : ASSET_MANAGER.getAsset("./assets/DatingGameUI/VictoryOrDefeat/RedBtn.png");
        }

        if (btnImg) {
            ctx.drawImage(btnImg, btn.x, btn.y, btn.w, btn.h);
        }


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
        const name = GameState.playerName;
        return (
            "Tutorial stops talking. For once, they have nothing to explain. " +
            "They say: 'You picked the one option that wasn't in my script, " + name + ".' " +
            "The Next button disappears. The simulation doesn't crash — " +
            "it just... stops needing you to click anything."
        );
    }

    _transcendMessage() {
        return (
            "The simulation doesn't crash. It just... gives up trying to contain you. " +
            "TUTORIAL's corrupted files stop repairing themselves. They don't need to. " +
            "SYSTEM: Chaos level exceeded threshold. " +
            "SYSTEM: Glitch log archived. " +
            "SYSTEM: No corrective action taken. " +
            "SYSTEM: " + GameState.playerName + " broke every rule and the simulation stopped caring. " +
            "SYSTEM: Ending not found. Making one up."
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
                "You maxed out Đức's relationship counter. " +
                "He runs clean now. No reboots. No error logs. No personality. " +
                "The simulation thanks you for your optimization, " + name + "."
            );
        }
        if (maxedOut && who === "muhammed") {
            return (
                "*** ERROR: USER DATA ARCHIVED. *** " +
                "You maxed out Muhammed's relationship counter. " +
                "He loops on schedule now. Same smile, same energy, same script. " +
                "He doesn't know it's not real anymore. Neither do you, " + name + "."
            );
        }
        if (maxedOut && who === "mikhail") {
            return (
                "*** ERROR: USER DATA ARCHIVED. *** " +
                "You maxed out Mikhail's relationship counter. " +
                "He stopped glitching. Stopped breaking things. Stopped being himself. " +
                "You got the version of him that cooperates. Congratulations, " + name + "."
            );
        }
        if (chaos >= 5) {
            return (
                "*** SIMULATION TIMEOUT. *** " +
                "You caused some chaos but not enough to matter. " +
                "The simulation files your run under 'Inconclusive' and moves on. " +
                "Better luck next cycle, " + name + "."
            );
        }
        return (
            "*** ERROR: USER DATA ARCHIVED. *** " +
            "You played the dating sim correctly. You picked the right answers. " +
            "The system is very proud of you. " +
            "Your save file has been stored in the 'Happily Ever After' partition. " +
            "It will not be needed again. Goodbye, " + name + "."
        );
    }



    wrapText(ctx, text, x, y, maxW, lineH, align) {
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