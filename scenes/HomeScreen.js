class HomeScreen {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;

        this.bg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
        this.btnImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/Button.png");
        this.btnPrs = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/ButtonPressed.png");

        this.W = this.game.ctx.canvas.width;
        this.H = this.game.ctx.canvas.height;

        this.btnW = 560;
        this.btnH = 100;
        this.btnX = this.W / 2 - this.btnW / 2;
        this.btnY = this.H * 0.4;

        this.gearBtn = { x: this.W - 180, y: this.H - 120, w: 140, h: 90 };
        this.gearHovered = false;
        this.gearPressed = false;

        this.titleY = 300;
        this.subtitleY = 410;

        this.state = "idle";
        this.animTimer = 0;
        this.animDuration = 0.9;
        this.titleSlide = -420;
        this.btnSlide = 400;
        this.titleOffset = 0;
        this.btnOffset = 0;
        this.opacity = 1;

        this.hovered = false;
        this.pressed = false;

        this.transitionAlpha = 0;
        this.startTime = Date.now();

        // Debug Menu Variables
        this.debugMenuOpen = false;

        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        MUSIC.playMenuMusic();
    }

    onKey(e) {
        if (this.state !== "idle" || this.transitionAlpha > 0) return;
        
        let hasOverlay = false;
        for (const entity of this.game.entities) {
            if (entity instanceof SettingsScene && !entity.removeFromWorld) {
                hasOverlay = true;
                break;
            }
        }
        if (hasOverlay) return;

        if (e.key === "s" || e.key === "S") {
            MUSIC.unlock();
            this.gearPressed = true;
            setTimeout(function() {
                this.gearPressed = false;
            }.bind(this), 120);
            this.game.addEntity(new SettingsScene(this.game, this));
        }
    }

    isHit(mx, my) {
        const by = this.btnY + this.btnOffset;
        if (mx >= this.btnX && mx <= this.btnX + this.btnW && my >= by && my <= by + this.btnH) {
            return true;
        } else {
            return false;
        }
    }

    isGearHit(mx, my) {
        const g = this.gearBtn;
        if (mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
            return true;
        } else {
            return false;
        }
    }

    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    update() {
        const dt = this.game.clockTick;
        const mouse = this.game.mouse;
        const click = this.game.click;

        // Process clicks for the debug menu first
        if (click) {
            let cx = click.x;
            let cy = click.y;

            // placing the toggle checkbox in the top right corner
            let toggleX = this.W - 80;
            let toggleY = 20;

            if (cx >= toggleX && cx <= toggleX + 40 && cy >= toggleY && cy <= toggleY + 40) {
                if (this.debugMenuOpen) {
                    this.debugMenuOpen = false;
                } else {
                    this.debugMenuOpen = true;
                }
                this.game.click = null;
                return;
            }

            // Options click hit boxes on the sticky note
            if (this.debugMenuOpen) {
                let noteX = this.W - 480;
                let noteY = 80;

                // looping through the 8 options
                for (let i = 0; i < 8; i++) {
                    let optY = noteY + 100 + (i * 35);
                    if (cx >= noteX + 20 && cx <= noteX + 400 && cy >= optY - 20 && cy <= optY + 10) {
                        this.applyDebugOption(i);
                        this.game.click = null;
                        return;
                    }
                }
            }
        }

        if (this.state === "idle") {
            if (mouse) {
                this.hovered = this.isHit(mouse.x, mouse.y);
                this.gearHovered = this.isGearHit(mouse.x, mouse.y);
            } else {
                this.hovered = false;
                this.gearHovered = false;
            }

            if (click && this.isGearHit(click.x, click.y)) {
                MUSIC.unlock();
                this.gearPressed = true;
                setTimeout(function() {
                    this.gearPressed = false;
                }.bind(this), 120);
                this.game.addEntity(new SettingsScene(this.game, this));
                this.game.click = null;
                return;
            }

            if (click && this.isHit(click.x, click.y)) {
                MUSIC.unlock();
                this.pressed = true;
                this.state = "animating";
                this.game.click = null;
            }

        } else if (this.state === "animating") {
            this.animTimer += dt;
            let t = this.animTimer / this.animDuration;
            if (t > 1) { t = 1; }
            const e = this.easeOut(t);

            this.titleOffset = this.titleSlide * e;
            this.btnOffset = this.btnSlide * e;
            this.opacity = 1 - e;

            if (t >= 1) {
                this.state = "done";
            }
        } else if (this.state === "done") {
            this.transitionAlpha += dt * 1.5;
            if (this.transitionAlpha >= 1) {
                GameState.reset();
                MUSIC.stopAllMusic();
                this.game.addEntity(new GlitchIntroScene(this.game));
                this.removeFromWorld = true;
            }
        }
    }

    applyDebugOption(index) {
        GameState.reset();
        MUSIC.stopAllMusic();

        // adding a fake name so the dialogue replacement {PLAYER_NAME} doesn't show undefined when we skip the intro
        GameState.playerName = "DEBUGGER";

        if (index === 0) {
            this.game.addEntity(new DialogueScene(this.game, "duc_day1_intro"));
        } else if (index === 1) {
            this.game.addEntity(new DialogueScene(this.game, "muhammed_day1_intro"));
        } else if (index === 2) {
            this.game.addEntity(new DialogueScene(this.game, "mikhail_day1_intro"));
        } else if (index === 3) {
            this.game.addEntity(new DialogueScene(this.game, "tutorial_intro_1"));
        } else if (index === 4) {
            this.game.addEntity(new EndingScene(this.game, "VICTORY"));
        } else if (index === 5) {
            this.game.addEntity(new EndingScene(this.game, "DEFEAT"));
        } else if (index === 6) {
            this.game.addEntity(new EndingScene(this.game, "TRANSCEND"));
        } else if (index === 7) {
            this.game.addEntity(new EndingScene(this.game, "AUTHENTIC"));
        }

        this.removeFromWorld = true;
    }

    draw(ctx) {
        if (this.bg) {
            ctx.drawImage(this.bg, 0, 0, this.W, this.H);
        }

        if (this.state === "done") {
            let fade = this.transitionAlpha;
            if (fade > 1) { fade = 1; }
            ctx.fillStyle = `rgba(0,0,0,${fade})`;
            ctx.fillRect(0, 0, this.W, this.H);
            return;
        }

        ctx.save();
        ctx.globalAlpha = this.opacity;

        const curTitleY = this.titleY + this.titleOffset;
        const curSubtitleY = this.subtitleY + this.titleOffset;

        ctx.textAlign = "center";
        ctx.font = "bold 108px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(220, 80, 140, 0.85)";
        ctx.shadowBlur = 28;

        const titleText = "DATING SIMULATOR!";
        let totalWidth = ctx.measureText(titleText).width;
        let startX = (this.W / 2) - (totalWidth / 2);

        ctx.textAlign = "left";

        let fallbackTime = this.startTime;
        if (!fallbackTime) { fallbackTime = Date.now(); }
        const elapsedTime = (Date.now() - fallbackTime) / 1000;
        const timeInCycle = elapsedTime % 3.0;

        for (let i = 0; i < titleText.length; i++) {
            const char = titleText[i];
            const charWidth = ctx.measureText(char).width;

            let bounceY = 0;
            const p = timeInCycle - i * 0.1;
            if (p > 0 && p < 0.5) {
                bounceY = Math.sin((p / 0.5) * Math.PI) * -30;
            }

            ctx.fillText(char, startX, curTitleY + bounceY);
            startX += charWidth;
        }

        ctx.shadowBlur = 0;
        ctx.textAlign = "center";
        ctx.font = "italic 44px 'Roboto', Georgia, sans-serif";
        ctx.fillStyle = "#d4457a";
        ctx.fillText("It's a Romance, Not a Bug ;)", this.W / 2, curSubtitleY);

        const curBtnY = this.btnY + this.btnOffset;

        let sprite = this.btnImg;
        if (this.pressed) {
            sprite = this.btnPrs;
        }

        if (sprite) {
            ctx.drawImage(sprite, this.btnX, curBtnY, this.btnW, this.btnH);
        }

        ctx.font = "bold 32px 'The Bold Font', 'Roboto', sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("START NEW GAME", this.btnX + this.btnW / 2, curBtnY + this.btnH / 2);

        if (this.hovered && this.state === "idle") {
            ctx.strokeStyle = "rgba(255, 180, 220, 0.7)";
            ctx.lineWidth = 4;
            ctx.strokeRect(this.btnX - 4, curBtnY - 4, this.btnW + 8, this.btnH + 8);
        }

        this.drawGearButton(ctx);
        this.drawDebugMenu(ctx);

        ctx.restore();
    }

    drawDebugMenu(ctx) {
        let toggleX = this.W - 80;
        let toggleY = 20;
        let toggleS = 40;

        // draw the empty checkbox
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(toggleX, toggleY, toggleS, toggleS);
        ctx.strokeStyle = "#d4457a";
        ctx.lineWidth = 4;
        ctx.strokeRect(toggleX, toggleY, toggleS, toggleS);

        if (this.debugMenuOpen) {
            let checkImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Checkmark.png");
            if (checkImg) {
                ctx.drawImage(checkImg, toggleX, toggleY, toggleS, toggleS);
            }

            let noteX = this.W - 480;
            let noteY = 80;
            let noteW = 440;
            let noteH = 400;

            // making the sticky note pop out with a bit of a shadow
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;

            ctx.fillStyle = "#fcf2aa";
            ctx.fillRect(noteX, noteY, noteW, noteH);
            ctx.restore();

            ctx.fillStyle = "#000000";

            // using standard web safe handwritten fonts so we don't have to load a new .ttf
            ctx.font = "bold 32px cursive";
            ctx.fillText("Debug Menu", noteX + 120, noteY + 50);

            let options = [
                "1st Day Meeting: Đức",
                "1st Day Meeting: Muhammed",
                "1st Day Meeting: Mikhail",
                "Tutorial: First interaction",
                "Ending Test: Victory",
                "Ending Test: Defeat",
                "Ending Test: Transcend",
                "Ending Test: Authentic"
            ];

            ctx.font = "20px 'Roboto', sans-serif";
            ctx.textAlign = "left";
            for (let i = 0; i < options.length; i++) {
                ctx.fillText("[ ] " + options[i], noteX + 20, noteY + 100 + (i * 35));
            }
        }
    }

    drawGearButton(ctx) {
        let g = this.gearBtn;
        let greenAsset = "./assets/DatingGameUI/GreenBtn.png";
        if (this.gearHovered) {
            greenAsset = "./assets/DatingGameUI/GreenBtnPressed.png";
        }
        let greenBtn = ASSET_MANAGER.getAsset(greenAsset);
        let gearIcon = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");

        if (greenBtn) {
            ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        }
        if (gearIcon) {
            let maxDim = gearIcon.width;
            if (gearIcon.height > maxDim) {
                maxDim = gearIcon.height;
            }
            if (!maxDim) { maxDim = 56; }

            let cx = g.x + g.w / 2;
            let cy = g.y + g.h / 2;
            let scale = 56 / maxDim;

            let iconW = gearIcon.width;
            if (!iconW) { iconW = 56; }
            let iconH = gearIcon.height;
            if (!iconH) { iconH = 56; }

            let w = iconW * scale;
            let h = iconH * scale;
            ctx.drawImage(gearIcon, cx - w / 2, cy - h / 2, w, h);
        }
    }
}