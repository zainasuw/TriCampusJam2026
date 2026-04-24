class SettingsScene {
    constructor(game) {
        this.game = game;
        this.removeFromWorld = false;

        this.fadeAlpha = 0;
        this.fadeDir = 1;
        this.closing = false;

        // canvas reference size
        const W = 1920, H = 1080;

        // outer panel that holds everything. centered-ish, with room for the pink SETTINGS title sitting just above it
        const panelW = 1400;
        const panelH = 780;
        this.PANEL = {
            x: (W - panelW) / 2,
            y: 180,
            w: panelW,
            h: panelH,
        };

        // inner padding so child containers sit nested inside the panel this was the bug earlier, the sound box was way
        // taller than the panel allowed
        const padX = 70;
        const padTop = 110;   // room for MASTER VOLUME label & its slider
        const padBottom = 40;

        // master volume container sits up top, inside the panel
        const masterW = 1200;
        const masterH = 100;
        this.MASTER_BOX = {
            x: this.PANEL.x + (this.PANEL.w - masterW) / 2,
            y: this.PANEL.y + padTop,
            w: masterW,
            h: masterH,
        };

        // sound settings container. anchored BELOW the master box with a gap, width inset from panel by padX on each
        // side so it's clearly nested. height = whatever's left in the panel minus the bottom padding.
        const soundGapTop = 90;   // space between master box and sound box (for SOUND SETTINGS label)
        this.SOUND_BOX = {
            x: this.PANEL.x + padX,
            y: this.MASTER_BOX.y + this.MASTER_BOX.h + soundGapTop,
            w: this.PANEL.w - (padX * 2),
            h: 0, // set below once we know bottom
        };
        this.SOUND_BOX.h = (this.PANEL.y + this.PANEL.h - padBottom) - this.SOUND_BOX.y;

        // sliders. master slider lives inside MASTER_BOX sfx/music live inside SOUND_BOX.
        const sliderInsetX = 100;  // how far in from the container edges the bar sits

        this.MASTER = {
            x: this.MASTER_BOX.x + sliderInsetX,
            y: this.MASTER_BOX.y + this.MASTER_BOX.h / 2 - 20,
            w: this.MASTER_BOX.w - sliderInsetX * 2 - 110,  // leave room for % label on the right
            h: 40,
            hideEmptyBar: true,
            getter: () => MUSIC.masterVolume,
            setter: v => {
                MUSIC.masterVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // sliders inside the sound box. toggles sit near the top, sliders in the lower half.
        const soundInsetX = 120;
        const sfxY = this.SOUND_BOX.y + this.SOUND_BOX.h * 0.55;
        const musY = this.SOUND_BOX.y + this.SOUND_BOX.h * 0.82;

        this.SFX = {
            x: this.SOUND_BOX.x + soundInsetX,
            y: sfxY - 20,
            w: this.SOUND_BOX.w - soundInsetX * 2 - 110,
            h: 40,
            getter: () => MUSIC.sfxVolume,
            setter: v => {
                MUSIC.sfxVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // music volume slider
        this.MUSIC_SLIDER = {
            x: this.SOUND_BOX.x + soundInsetX,
            y: musY - 20,
            w: this.SOUND_BOX.w - soundInsetX * 2 - 110,
            h: 40,
            getter: () => MUSIC.musicVolume,
            setter: v => {
                MUSIC.musicVolume = v;
                MUSIC.applyVolumes();
            },
        };

        // toggle switches near the top of the sound box, centered horizontally around the quarter points
        const toggleW = 149;
        const toggleH = 53;
        const toggleY = this.SOUND_BOX.y + 90;
        const soundMidX = this.SOUND_BOX.x + this.SOUND_BOX.w / 2;
        this.DIALOGUE_TOGGLE = {
            x: soundMidX - 200 - toggleW / 2,
            y: toggleY,
            w: toggleW,
            h: toggleH,
        };
        this.MUSIC_TOGGLE = {
            x: soundMidX + 200 - toggleW / 2,
            y: toggleY,
            w: toggleW,
            h: toggleH,
        };

        // back arrow button top left
        this.BACK_BTN = {x: 40, y: 40, w: 140, h: 90};
        // gear button bottom-right
        this.GEAR_BTN = {x: W - 180, y: H - 120, w: 140, h: 90};

        this.draggingSlider = null;
        this.gearHovered = false;

        // escape key closes
        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);
    }

    onKey(e) {
        if (this.closing) return;
        if (e.key === "Escape" || e.key === "s" || e.key === "S") {
            this.closing = true;
            this.fadeDir = -1;
        }
    }

    hit(r, p) {
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
        if (mouse) this.gearHovered = this.hit(this.GEAR_BTN, mouse);
        else this.gearHovered = false;

        // check for new drags
        if (this.game.mouseDown && !this.draggingSlider && mouse) {
            const sliders = [this.MASTER, this.SFX, this.MUSIC_SLIDER];
            for (let i = 0; i < sliders.length; i++) {
                const s = sliders[i];
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
            if (this.hit(this.GEAR_BTN, click)) {
                this.closing = true;
                this.fadeDir = -1;
                this.game.click = null;
                return;
            }

            // back arrow to close settings
            if (this.hit(this.BACK_BTN, click)) {
                this.closing = true;
                this.fadeDir = -1;
                this.game.click = null;
                return;
            }

            // toggles
            if (this.hit(this.DIALOGUE_TOGGLE, click)) {
                MUSIC.dialogueOn = !MUSIC.dialogueOn;
                MUSIC.applyVolumes();
                this.game.click = null;
                return;
            }
            if (this.hit(this.MUSIC_TOGGLE, click)) {
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

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // draw the HomeScreen background as the backdrop so the gameplay scene below is completely hidden no title/play
        // button visible though we just want the asset backdrop
        const bg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
        if (bg) {
            ctx.drawImage(bg, 0, 0, W, H);
        }

        // Back arrow button
        const blueBtn = ASSET_MANAGER.getAsset("./assets/DatingGameUI/ExitPopup/BlueBtn.png");
        const backArrow = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/BackArrow.png");
        if (blueBtn) {
            ctx.drawImage(blueBtn, this.BACK_BTN.x, this.BACK_BTN.y, this.BACK_BTN.w, this.BACK_BTN.h);
        }
        // center the arrow inside the blue polygon button
        if (backArrow) {
            const arrowW = 70;
            const arrowH = 70;
            const cx = this.BACK_BTN.x + this.BACK_BTN.w / 2;
            const cy = this.BACK_BTN.y + this.BACK_BTN.h / 2;
            ctx.drawImage(backArrow, cx - arrowW / 2, cy - arrowH / 2, arrowW, arrowH);
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
        ctx.fillText("SETTINGS", W / 2, 100);
        ctx.shadowBlur = 0;

        // main translucent panel rounded w/ pink border
        const settingBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SettingsBackground.png");
        if (settingBg) {
            ctx.drawImage(settingBg, this.PANEL.x, this.PANEL.y, this.PANEL.w, this.PANEL.h);
        }

        // master volume section
        this.drawSectionLabel(ctx, "MASTER VOLUME", W / 2, this.MASTER_BOX.y - 30);
        const masterContainer = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/MasterVolumeContainer.png");
        if (masterContainer) {
            ctx.drawImage(masterContainer, this.MASTER_BOX.x, this.MASTER_BOX.y, this.MASTER_BOX.w, this.MASTER_BOX.h);
        }

        this.drawSlider(ctx, this.MASTER);

        // sound settings subsection
        this.drawSectionLabel(ctx, "SOUND SETTINGS", W / 2, this.SOUND_BOX.y - 30);

        // inner pink container for the soundsettings block
        const soundContainer = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SoundSettingsContainer.png");
        if (soundContainer) {
            ctx.drawImage(soundContainer, this.SOUND_BOX.x, this.SOUND_BOX.y, this.SOUND_BOX.w, this.SOUND_BOX.h);
        }
        // dialogue, Music ON-OFF toggles (not implemented yet but in case we want to add sfx in future)
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "28px 'Roboto', sans-serif";
        ctx.fillStyle = "#6a6680";
        const labelY = this.DIALOGUE_TOGGLE.y - 26;
        ctx.fillText("Dialogue", this.DIALOGUE_TOGGLE.x + this.DIALOGUE_TOGGLE.w / 2, labelY);
        ctx.fillText("Music",    this.MUSIC_TOGGLE.x + this.MUSIC_TOGGLE.w / 2, labelY);

        this.drawToggle(ctx, this.DIALOGUE_TOGGLE, MUSIC.dialogueOn);
        this.drawToggle(ctx, this.MUSIC_TOGGLE, MUSIC.musicOn);

        // SFX & Music sliders live inside inner pink box
        this.drawSliderLabel(ctx, "Sound Effects Volume", W / 2, this.SFX.y - 28);
        this.drawSlider(ctx, this.SFX);

        this.drawSliderLabel(ctx, "Music Volume", W / 2, this.MUSIC_SLIDER.y - 28);
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
        const barEmpty = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeBarEmpty.png");
        const barFill = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeFill.png");
        const knob = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/VolumeKnob.png");
        const pct = Math.max(0, Math.min(1, s.getter()));
        const fillW = s.w * pct;
        const trackY = s.y + (s.h - 30) / 2;

        if (barEmpty && !s.hideEmptyBar) {
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
        const cx = s.x + fillW;
        const cy = s.y + s.h / 2;
        if (knob) {
            ctx.drawImage(knob, cx - 42, cy - 42, 83, 83);
        }

        // percentage label
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "bold 26px 'Roboto', sans-serif";
        ctx.fillStyle = "#4a4660";
        ctx.fillText(Math.round(pct * 100) + "%", s.x + s.w + 20, cy);
    }

    drawGearButton(ctx) {
        const g = this.GEAR_BTN;
        let greenAssetPath = "./assets/DatingGameUI/GreenBtn.png";
        if (this.gearHovered) greenAssetPath = "./assets/DatingGameUI/GreenBtnPressed.png";
        const greenBtn = ASSET_MANAGER.getAsset(greenAssetPath);
        const gearIcon = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");

        if (greenBtn) {
            ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        }
        if (gearIcon) {
            const cx = g.x + g.w / 2;
            const cy = g.y + g.h / 2;
            const scale = 56 / Math.max(gearIcon.width || 56, gearIcon.height || 56);
            const w = (gearIcon.width || 56) * scale;
            const h = (gearIcon.height || 56) * scale;
            ctx.drawImage(gearIcon, cx - w / 2, cy - h / 2, w, h);
        }
    }
    drawToggle(ctx, toggle, isOn) {
        const switchBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/SwitchBackground.png");
        const switchThumb = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Settings/Switch.png");

        if (switchBg) {
            ctx.drawImage(switchBg, toggle.x, toggle.y, toggle.w, toggle.h);
        }
        if (switchThumb) {
            const thumbW = 75;
            let thumbX;
            if (isOn) thumbX = toggle.x + toggle.w - thumbW;
            else thumbX = toggle.x;
            ctx.drawImage(switchThumb, thumbX, toggle.y, thumbW, toggle.h);
        }
    }


}
