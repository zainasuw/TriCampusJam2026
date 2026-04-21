class SettingsScene {
    constructor(game, underlying) {
        this.game = game;
        this.underlying = underlying;
        this.removeFromWorld = false;

        this.fadeAlpha = 0;
        this.fadeDir = 1;
        this.closing = false;

        // panel geometry canvas is 1920x1080
        this.PANEL = { x: 260, y: 130, w: 1400, h: 820 };

        // back arrow button top left of screen
        this.BACK_BTN = { x: 40, y: 40, w: 140, h: 90 };

        // gear icon button bottom right of screen
        this.GEAR_BTN = { x: 1920 - 180, y: 1080 - 120, w: 140, h: 90 };

        // master volume slider
        this.MASTER = {
            label: "MASTER VOLUME",
            x: 520, y: 330, w: 880, h: 40,
            getter: () => MUSIC.masterVolume,
            setter: v => { MUSIC.masterVolume = v; MUSIC.applyVolumes(); },
        };

        // sound effects slider
        this.SFX = {
            label: "Sound Effects Volume",
            x: 520, y: 700, w: 880, h: 40,
            getter: () => MUSIC.sfxVolume,
            setter: v => { MUSIC.sfxVolume = v; MUSIC.applyVolumes(); },
        };

        // music volume slider
        this.MUSIC_SLIDER = {
            label: "Music Volume",
            x: 520, y: 820, w: 880, h: 40,
            getter: () => MUSIC.musicVolume,
            setter: v => { MUSIC.musicVolume = v; MUSIC.applyVolumes(); },
        };

        // toggles
        this.DIALOGUE_ON  = { x: 680,  y: 570, w: 90, h: 60 };
        this.DIALOGUE_OFF = { x: 780,  y: 570, w: 90, h: 60 };
        this.MUSIC_ON     = { x: 1030, y: 570, w: 90, h: 60 };
        this.MUSIC_OFF    = { x: 1130, y: 570, w: 90, h: 60 };

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
            if (this._hit(this.DIALOGUE_ON, click))  {  MUSIC.dialogueOn = true;  MUSIC.applyVolumes(); this.game.click = null; return; }
            if (this._hit(this.DIALOGUE_OFF, click)) {  MUSIC.dialogueOn = false; MUSIC.applyVolumes(); this.game.click = null; return; }
            if (this._hit(this.MUSIC_ON, click))     {  MUSIC.musicOn = true;     MUSIC.applyVolumes(); this.game.click = null; return; }
            if (this._hit(this.MUSIC_OFF, click))    {  MUSIC.musicOn = false;    MUSIC.applyVolumes(); this.game.click = null; return; }

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

        // back arrow blue parallelogram
        this._drawSlantButton(ctx, this.BACK_BTN, "#6bb3f0", "#3a7dc4", "arrow");

        // gear icon in bottom right green parallelogram
        this._drawGearButton(ctx);

        // settings title
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ff9dc6";
        ctx.fillText("SETTINGS", W / 2, 90);

        // main translucent panel rounded w/ pink border
        this._roundRect(ctx, this.PANEL.x, this.PANEL.y, this.PANEL.w, this.PANEL.h, 8);
        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
        ctx.fill();
        ctx.strokeStyle = "#ff9dc6";
        ctx.lineWidth = 3;
        this._roundRect(ctx, this.PANEL.x, this.PANEL.y, this.PANEL.w, this.PANEL.h, 8);
        ctx.stroke();

        // master volume section
        this._drawSectionLabel(ctx, "MASTER VOLUME", W / 2, 270);
        this._drawSlider(ctx, this.MASTER);

        // sound settings subsection
        this._drawSectionLabel(ctx, "SOUND SETTINGS", W / 2, 470);

        // inner pink container for the soundsettings block
        this._roundRect(ctx, 420, 520, 1080, 400, 6);
        ctx.fillStyle = "rgba(255, 210, 230, 1.0)";
        ctx.fill();

        // dialogue, Music ON-OFF toggles (not implemented yet but in case we want to add sfx in future)
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "28px 'Roboto', sans-serif";
        ctx.fillStyle = "#6a6680";
        ctx.fillText("Dialogue", 775, 540);
        ctx.fillText("Music",    1125, 540);

        this._drawToggle(ctx, this.DIALOGUE_ON,  "ON",  MUSIC.dialogueOn === true);
        this._drawToggle(ctx, this.DIALOGUE_OFF, "OFF", MUSIC.dialogueOn === false);
        this._drawToggle(ctx, this.MUSIC_ON,     "ON",  MUSIC.musicOn === true);
        this._drawToggle(ctx, this.MUSIC_OFF,    "OFF", MUSIC.musicOn === false);

        // SFX & Music sliders live inside inner pink box
        this._drawSliderLabel(ctx, "Sound Effects Volume", W / 2, 680);
        this._drawSlider(ctx, this.SFX);

        this._drawSliderLabel(ctx, "Music Volume", W / 2, 800);
        this._drawSlider(ctx, this.MUSIC_SLIDER);

        ctx.restore();
    }

    _drawSectionLabel(ctx, text, cx, cy) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 42px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#2f2a52";
        ctx.fillText(text, cx, cy);
    }

    _drawSliderLabel(ctx, text, cx, cy) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "28px 'Roboto', sans-serif";
        ctx.fillStyle = "#6a6680";
        ctx.fillText(text, cx, cy);
    }

    _drawSlider(ctx, s) {
        // Track
        this._roundRect(ctx, s.x, s.y, s.w, s.h, 8);
        ctx.fillStyle = "rgba(255, 220, 235, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "rgba(220, 170, 200, 0.6)";
        ctx.lineWidth = 2;
        this._roundRect(ctx, s.x, s.y, s.w, s.h, 8);
        ctx.stroke();

        // filled portion
        const pct = Math.max(0, Math.min(1, s.getter()));
        const fillW = s.w * pct;
        if (fillW > 0) {
            this._roundRect(ctx, s.x, s.y, fillW, s.h, 8);
            ctx.fillStyle = "#4a9fe0";
            ctx.fill();
        }

        // handle
        const cx = s.x + fillW;
        const cy = s.y + s.h / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = "#5ab0f0";
        ctx.fill();
        ctx.strokeStyle = "#2a70b0";
        ctx.lineWidth = 2;
        ctx.stroke();

        // percentage readout
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = "bold 26px 'Roboto', sans-serif";
        ctx.fillStyle = "#4a4660";
        ctx.fillText(Math.round(pct * 100) + "%", s.x + s.w + 20, cy);
    }

    _drawToggle(ctx, r, label, active) {
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 4);
        if (active) {
            ctx.fillStyle = "#4a9fe0";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
        } else {
            ctx.fillStyle = "rgba(80, 70, 100, 0.85)";
            ctx.fill();
            ctx.fillStyle = "#d0c8dc";
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 28px 'The Bold Font', sans-serif";
        ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
    }

    _drawSlantButton(ctx, r, fill, border, iconKind) {
        // Pprallelogram shape
        const skew = 18;
        ctx.beginPath();
        ctx.moveTo(r.x + skew, r.y);
        ctx.lineTo(r.x + r.w,   r.y);
        ctx.lineTo(r.x + r.w - skew, r.y + r.h);
        ctx.lineTo(r.x,          r.y + r.h);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "#ffffff";
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        if (iconKind === "arrow") {
            // leftward arrow
            ctx.beginPath();
            ctx.moveTo(cx - 22, cy);
            ctx.lineTo(cx + 14, cy - 18);
            ctx.lineTo(cx + 14, cy - 6);
            ctx.lineTo(cx + 26, cy - 6);
            ctx.lineTo(cx + 26, cy + 6);
            ctx.lineTo(cx + 14, cy + 6);
            ctx.lineTo(cx + 14, cy + 18);
            ctx.closePath();
            ctx.fill();
        } else if (iconKind === "gear") {
            const gearAsset = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");
            if (gearAsset) {
                // background black dot
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, Math.PI * 2);
                ctx.fillStyle = "#000000";
                ctx.fill();

                // draw gear proportionally
                const scale = 56 / Math.max(gearAsset.width || 56, gearAsset.height || 56);
                const w = (gearAsset.width || 56) * scale;
                const h = (gearAsset.height || 56) * scale;
                ctx.drawImage(gearAsset, cx - w / 2, cy - h / 2, w, h);
            } else {
                // simple gear fallback
                const teeth = 8;
                const outer = 22, inner = 15, tooth = 5;
                ctx.beginPath();
                for (let i = 0; i < teeth * 2; i++) {
                    const ang = (i / (teeth * 2)) * Math.PI * 2;
                    const radius = (i % 2 === 0) ? outer + tooth : outer;
                    const px = cx + Math.cos(ang) * radius;
                    const py = cy + Math.sin(ang) * radius;
                    if (i === 0) ctx.moveTo(px, py);
                    else         ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                // inner hole
                ctx.globalCompositeOperation = "destination-out";
                ctx.beginPath();
                ctx.arc(cx, cy, inner - 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";
            }
        }
        ctx.restore();
    }

    _drawGearButton(ctx) {
        const g = this.GEAR_BTN;

        // prefer settings icon asset if present; otherwise draw green parallelogram with a vector gear so it still renders.
        const gearAsset = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");
        const greenBtn = ASSET_MANAGER.getAsset(this.gearHovered
            ? "./assets/DatingGameUI/GreenBtnPressed.png"
            : "./assets/DatingGameUI/GreenBtn.png");

        if (greenBtn) {
            ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        } else {
            // fallback draw a green parallelogram
            const skew = 18;
            ctx.beginPath();
            ctx.moveTo(g.x + skew, g.y);
            ctx.lineTo(g.x + g.w,  g.y);
            ctx.lineTo(g.x + g.w - skew, g.y + g.h);
            ctx.lineTo(g.x,        g.y + g.h);
            ctx.closePath();
            ctx.fillStyle = this.gearHovered ? "#6bc870" : "#7ed082";
            ctx.fill();
            ctx.strokeStyle = "#4a9a52";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        const cx = g.x + g.w / 2;
        const cy = g.y + g.h / 2;

        if (gearAsset) {
            // background black dot when open inside Settings
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#000000";
            ctx.fill();

            // draw gear proportionally
            const scale = 56 / Math.max(gearAsset.width || 56, gearAsset.height || 56);
            const w = (gearAsset.width || 56) * scale;
            const h = (gearAsset.height || 56) * scale;
            ctx.drawImage(gearAsset, cx - w / 2, cy - h / 2, w, h);
        } else {
            // vector gear fallback
            ctx.save();
            ctx.fillStyle = "#ffffff";
            const teeth = 8, outer = 22, inner = 15, tooth = 5;
            ctx.beginPath();
            for (let i = 0; i < teeth * 2; i++) {
                const ang = (i / (teeth * 2)) * Math.PI * 2;
                const radius = (i % 2 === 0) ? outer + tooth : outer;
                const px = cx + Math.cos(ang) * radius;
                const py = cy + Math.sin(ang) * radius;
                if (i === 0) ctx.moveTo(px, py);
                else         ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(cx, cy, inner - 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.gearHovered) {
            ctx.strokeStyle = "rgba(120, 220, 140, 0.8)";
            ctx.lineWidth = 3;
            ctx.strokeRect(g.x - 3, g.y - 3, g.w + 6, g.h + 6);
        }
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
}

