class SettingsScene {
    constructor(game, underlying) {
        this.game = game;
        this.underlying = underlying;
        this.removeFromWorld = false;

        this.fadeAlpha = 0;
        this.fadeDir = 1;
        this.closing = false;

        // panel geometry canvas is 1920x1080
        this.PANEL = {x: 260, y: 130, w: 1400, h: 820};

        // back arrow button top left of screen
        this.BACK_BTN = {x: 40, y: 40, w: 140, h: 90};

        // gear icon button bottom right of screen
        this.GEAR_BTN = {x: 1920 - 180, y: 1080 - 120, w: 140, h: 90};

        // master volume slider
        this.MASTER = {
            label: "MASTER VOLUME",
            x: 520, y: 330, w: 880, h: 40,
            getter: () => MUSIC.masterVolume,
            setter: v => {
                MUSIC.masterVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // sound effects slider
        this.SFX = {
            label: "Sound Effects Volume",
            x: 520, y: 700, w: 880, h: 40,
            getter: () => MUSIC.sfxVolume,
            setter: v => {
                MUSIC.sfxVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // music volume slider
        this.MUSIC_SLIDER = {
            label: "Music Volume",
            x: 520, y: 820, w: 880, h: 40,
            getter: () => MUSIC.musicVolume,
            setter: v => {
                MUSIC.musicVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // toggles - matching background asset
        this.DIALOGUE_TOGGLE = {x: 700, y: 570, w: 149, h: 53};
        this.MUSIC_TOGGLE = {x: 1050, y: 570, w: 149, h: 53};

        this.draggingSlider = null;

        // escape key closes
        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);
    }

    _onKey(e) {
        if (this.closing) return;
        if (e.key === "Escape") {
            this.closing = true;
            this.fadeDir = -1;
        }
    }

    _hit(r, p) {
        return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    }

    update() {
        const dt = this.game.clockTick;

        // fade animation
        this.fadeAlpha += this.fadeDir * dt * 5;
        this.fadeAlpha = Math.max(0, Math.min(1, this.fadeAlpha));

        if (this.closing && this.fadeAlpha <= 0) {
            document.removeEventListener("keydown", this.keyHandler);
            this.removeFromWorld = true;
            return;
        }

        if (this.fadeAlpha < 1 || this.closing) {
            this.game.click = null;
            return;
        }

        const mouse = this.game.mouse;
        const click = this.game.click;

        // track gear hover inside settings so button changes correctly
        this.gearHovered = mouse ? this._hit(this.GEAR_BTN, mouse) : false;

        // check for new drags
        if (this.game.mouseDown && !this.draggingSlider && mouse) {
            for (const s of [this.MASTER, this.SFX, this.MUSIC_SLIDER]) {
                if (mouse.x >= s.x - 20 && mouse.x <= s.x + s.w + 20 &&
                    mouse.y >= s.y - 30 && mouse.y <= s.y + s.h + 30) {
                    this.draggingSlider = s;
                    // initial jump
                    const pct = Math.max(0, Math.min(1, (mouse.x - s.x) / s.w));
                    s.setter(pct);

                }
            }
        }

        // process drag
        if (this.draggingSlider && this.game.mouseDown && mouse) {
            const s = this.draggingSlider;
            const pct = Math.max(0, Math.min(1, (mouse.x - s.x) / s.w));
            s.setter(pct);
        }

        // drop
        if (this.draggingSlider && !this.game.mouseDown) {
            this.draggingSlider = null;
        }

        if (click) {
            // toggle close the gear button
            if (this._hit(this.GEAR_BTN, click)) {

                this.closing = true;
                this.fadeDir = -1;
                this.game.click = null;
                return;
            }

            // back arrow to close settings
            if (this._hit(this.BACK_BTN, click)) {

                this.closing = true;
                this.fadeDir = -1;
                this.game.click = null;
                return;
            }

            // toggles
            if (this._hit(this.DIALOGUE_TOGGLE, click)) {
                MUSIC.dialogueOn = !MUSIC.dialogueOn;
                MUSIC.applyVolumes();
                this.game.click = null;
                return;
            }
            if (this._hit(this.MUSIC_TOGGLE, click)) {
                MUSIC.musicOn = !MUSIC.musicOn;
                MUSIC.applyVolumes();
                this.game.click = null;
                return;
            }


            // anywhere else eat the click don't let it fall through
            this.game.click = null;
        }

        // consume inputs to block scene below from interacting while this menu is open
        if (this.game.mouseDown) this.game.mouse = null;
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // dim the underlying scene slightly
        ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        //Back arrow button
        var blueBtn = ASSET_MANAGER.getAsset("./assets/DatingGameUI/ExitPopup/BlueBtn.png");
        var backArrow = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/BackArrow.png");
        if (blueBtn) {
            ctx.drawImage(blueBtn, this.BACK_BTN.x, this.BACK_BTN.y, this.BACK_BTN.w, this.BACK_BTN.h);
        }


        if (backArrow) {
            ctx.drawImage(backArrow, this.BACK_BTN.x + 20, this.BACK_BTN.y + 20, 70, 70);
        }

        //Gear button
        this.drawGearButton(ctx);

        // settings title
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ff9dc6";
        ctx.shadowColor = "rgba(255, 160, 200, 0.5)";
        ctx.shadowBlur = 18;
        ctx.fillText("SETTINGS", W / 2, 90);
        ctx.shadowBlur = 0;

        // main translucent panel rounded w/ pink border
        var settingBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SettingsBackground.png");
        if (settingBg) {
            ctx.drawImage(settingBg, this.PANEL.x, this.PANEL.y, this.PANEL.w, this.PANEL.h);
        }

        // master volume section
        this.drawSectionLabel(ctx, "MASTER VOLUME", W / 2, 270);
        var masterContainer = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/MasterVolumeContainer.png");
        if (masterContainer) {
            ctx.drawImage(masterContainer, 420, 300, 1080, 120);
        }

        this.drawSlider(ctx, this.MASTER);

        // sound settings subsection
        this.drawSectionLabel(ctx, "SOUND SETTINGS", W / 2, 470);

        // inner pink container for the soundsettings block
        var soundContainer = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SoundSettingsContainer.png");
        if (soundContainer) {
            ctx.drawImage(soundContainer, 420, 520, 1080, 400);
        }
        // dialogue, Music ON-OFF toggles (not implemented yet but in case we want to add sfx in future)
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "28px 'Roboto', sans-serif";
        ctx.fillStyle = "#6a6680";
        ctx.fillText("Dialogue", 775, 540);
        ctx.fillText("Music", 1125, 540);

        this.drawToggle(ctx, this.DIALOGUE_TOGGLE,  MUSIC.dialogueOn);
        this.drawToggle(ctx, this.MUSIC_TOGGLE,  MUSIC.musicOn);

        // SFX & Music sliders live inside inner pink box
        this.drawSliderLabel(ctx, "Sound Effects Volume", W / 2, 680);
        this.drawSlider(ctx, this.SFX);

        this.drawSliderLabel(ctx, "Music Volume", W / 2, 800);
        this.drawSlider(ctx, this.MUSIC_SLIDER);

        ctx.restore();
    }

    drawSectionLabel(ctx, text, cx, cy) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 42px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#2f2a52";
        ctx.fillText(text, cx, cy);
    }

    drawSliderLabel(ctx, text, cx, cy) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "28px 'Roboto', sans-serif";
        ctx.fillStyle = "#6a6680";
        ctx.fillText(text, cx, cy);
    }

    drawSlider(ctx, s) {
        var barEmpty = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeBarEmpty.png");
        var barFill = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeFill.png");
        var knob = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeKnob.png");
        const pct = Math.max(0, Math.min(1, s.getter()));
        const fillW = s.w * pct;
        const trackY = s.y + (s.h - 30) / 2;

        if (barEmpty) {
            ctx.drawImage(barEmpty, s.x, trackY, s.w, 30);
        }

        //filled part
        if (fillW > 0 && barFill) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(s.x, trackY, fillW, 30);
            ctx.clip();
            ctx.drawImage(barFill, s.x, trackY, s.w, 30);
            ctx.restore();
        }
        //Knob
        var cx = s.x + fillW;
        var cy = s.y + s.h / 2;
        if (knob) {
            ctx.drawImage(knob, cx - 42, cy - 42, 83, 83);
        }

        //Percentage
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "bold 26px 'Roboto', sans-serif";
        ctx.fillStyle = "#4a4660";
        ctx.fillText(Math.round(pct * 100) + "%", s.x + s.w + 20, cy);

    }

    drawGearButton(ctx) {
        var g = this.GEAR_BTN;
        var greenBtn = ASSET_MANAGER.getAsset(this.gearHovered
            ? "./assets/DatingGameUI/GreenBtnPressed.png"
            : "./assets/DatingGameUI/GreenBtn.png");
        var gearIcon = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");

        if (greenBtn) {
            ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        }
        if (gearIcon) {
            var cx = g.x + g.w / 2;
            var cy = g.y + g.h / 2;
            var scale = 56 / Math.max(gearIcon.width || 56, gearIcon.height || 56);
            var w = (gearIcon.width || 56) * scale;
            var h = (gearIcon.height || 56) * scale;
            ctx.drawImage(gearIcon, cx - w / 2, cy - h / 2, w, h);
        }
    }
    drawToggle(ctx,toggle,isOn){
        var switchBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SwitchBackground.png");
        var switchThumb = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/Switch.png");

        if (switchBg) {
            ctx.drawImage(switchBg, toggle.x, toggle.y, toggle.w, toggle.h);
        }
        if (switchThumb) {
            var thumbW = 75;
            var thumbX = isOn ? toggle.x + toggle.w - thumbW : toggle.x;
            ctx.drawImage(switchThumb, thumbX, toggle.y, thumbW, toggle.h);
        }
    }


}
