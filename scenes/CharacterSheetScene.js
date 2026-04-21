const CHARACTER_DATA = {
    duc: {
        displayName: "ĐỨC",
        likes: "Clean code, coffee, closed tickets",
        dislikes: "Emotional outbursts, Mikhail",
        notes: "Patches bugs for a living. Possibly yours.",
    },
    muhammed: {
        displayName: "MUHAMMED",
        likes: "Everyone, everything, outdated slang",
        dislikes: "Silence, being alone, thinking too deeply",
        notes: "Repeats himself. A lot. Might be a Vine.",
    },
    mikhail: {
        displayName: "MIKHAIL",
        likes: "Breaking rules, being right, Tutorial (secretly)",
        dislikes: "Đức, scripts, being perceived",
        notes: "His dialogue has syntax errors. On purpose?",
    },
    tutorial: {
        displayName: "TUTORIAL",
        likes: "????",
        dislikes: "????",
        notes: "....I am just here to explain the buttons. Pay no attention to me. Focus on the other bachelors, please.",
        isTutorial: true,
    },
};

class CharacterSheetScene {
    constructor(game, underlying) {
        this.game = game;
        this.underlying = underlying;
        this.removeFromWorld = false;

        this.selectedKey = null;
        for (const k of ["duc", "muhammed", "mikhail"]) {
            if (GameState.metCharacters[k]) { this.selectedKey = k; break; }
        }

        this.hoveredSlot = -1;

        this.fadeAlpha = 0;
        this.fadeDir = 1;
        this.closing = false;

        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        this.LEFT = { x: 60, y: 130, w: 1180, h: 870 };
        this.RIGHT = { x: 1270, y: 130, w: 590, h: 870 };

        this.GRID_COLS = 2;
        this.GRID_ROWS = 2;
        this.SLOT_SIZE = 250;
        this.SLOT_GAP = 60;
        this.GRID_START = { x: 360, y: 280 };

        this.SLOT_KEYS = ["duc", "muhammed", "mikhail", "tutorial"];
    }

    _onKey(e) {
        if (this.closing) return;
        if (e.key === "i" || e.key === "I" || e.key === "Escape") {
            this.closing = true;
            this.fadeDir = -1;
        }
    }

    _slotRect(index) {
        const col = index % this.GRID_COLS;
        const row = Math.floor(index / this.GRID_COLS);
        return {
            x: this.GRID_START.x + col * (this.SLOT_SIZE + this.SLOT_GAP),
            y: this.GRID_START.y + row * (this.SLOT_SIZE + this.SLOT_GAP + 40),
            w: this.SLOT_SIZE,
            h: this.SLOT_SIZE,
        };
    }

    update() {
        const dt = this.game.clockTick;

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

        this.hoveredSlot = -1;
        if (mouse) {
            for (let i = 0; i < this.SLOT_KEYS.length; i++) {
                const r = this._slotRect(i);
                if (mouse.x >= r.x && mouse.x <= r.x + r.w &&
                    mouse.y >= r.y && mouse.y <= r.y + r.h) {
                    this.hoveredSlot = i;
                    break;
                }
            }
        }

        if (click) {
            for (let i = 0; i < this.SLOT_KEYS.length; i++) {
                const r = this._slotRect(i);
                const key = this.SLOT_KEYS[i];
                if (click.x >= r.x && click.x <= r.x + r.w &&
                    click.y >= r.y && click.y <= r.y + r.h) {
                    if (key && GameState.metCharacters[key]) {
                        this.selectedKey = key;
                    }
                    this.game.click = null;
                    break;
                }
            }
            this.game.click = null;
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        ctx.fillStyle = `rgba(0,0,0,${0.55 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ff4fa0";
        ctx.shadowColor = "rgba(255,80,160,0.6)";
        ctx.shadowBlur = 22;
        ctx.fillText("CHARACTERS", W / 2, 70);
        ctx.shadowBlur = 0;

        this.drawPanel(ctx, this.LEFT);

        for (let i = 0; i < this.SLOT_KEYS.length; i++) {
            this.drawSlot(ctx, i);
        }

        this.drawPanel(ctx, this.RIGHT);
        this.drawDetails(ctx);

        var shadowImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/BottomShadow.png");
        if (shadowImg) {
            ctx.drawImage(shadowImg, 0, H - 120, W, 120);
        }

        ctx.textAlign = "center";
        ctx.font = "22px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillText("Press I or ESC to close", W / 2, H - 30);

        ctx.restore();
    }

    drawPanel(ctx, r) {
        var bgImg = (r === this.LEFT)
            ? ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterSheetBackground.png")
            : ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterDetailsBackground.png");
        if (bgImg) {
            ctx.drawImage(bgImg, r.x, r.y, r.w, r.h);
        }
    }

    drawSlot(ctx, index) {
        const r = this._slotRect(index);
        const key = this.SLOT_KEYS[index];
        const known = key && GameState.metCharacters[key];
        const isSelected = key === this.selectedKey;
        const isHovered = index === this.hoveredSlot;

        var containerImg = known
            ? ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png")
            : ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/UnknownCharacterContainer.png");
        if (containerImg) {
            ctx.drawImage(containerImg, r.x, r.y, r.w, r.h);
        }

        const pad = 18;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const faceMap = {
            duc:      "./assets/characters/guy1/Face.png",
            muhammed: "./assets/characters/guy3/Face.png",
            mikhail:  "./assets/characters/guy2/Face.png",
        };
        const faceImg = (known && faceMap[key]) ? ASSET_MANAGER.getAsset(faceMap[key]) : null;
        if (faceImg) {
            const ip = pad + 4;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(r.x + ip, r.y + ip, r.w - ip * 2, r.h - ip * 2, 8);
            ctx.clip();
            ctx.drawImage(faceImg, r.x + ip, r.y + ip, r.w - ip * 2, r.h - ip * 2);
            ctx.restore();
        } else if (!known) {
            ctx.fillStyle = "#8a7a92";
            ctx.font = "bold 64px 'The Bold Font', serif";
            ctx.fillText("?", r.x + r.w / 2, r.y + r.h / 2);
        }

        if (isSelected) {
            var selImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SelectedCharacter.png");
            if (selImg) {
                ctx.drawImage(selImg, r.x - 6, r.y - 6, r.w + 12, r.h + 12);
            }
        } else if (isHovered) {
            ctx.strokeStyle = "#ff4fa0";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 18);
            ctx.stroke();
        }

        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 22px 'The Bold Font', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = known && CHARACTER_DATA[key] ? CHARACTER_DATA[key].displayName : "???";
        ctx.fillText(label, r.x + r.w / 2, r.y + r.h + 8);
    }

    drawDetails(ctx) {
        const r = this.RIGHT;
        const key = this.selectedKey;
        const data = key ? CHARACTER_DATA[key] : null;

        if (!data) {
            ctx.fillStyle = "#8a6a92";
            ctx.font = "italic 28px 'Roboto', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Talk to someone first.", r.x + r.w / 2, r.y + r.h / 2);
            return;
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const px = r.x + 30, py = r.y + 30, ps = 220;
        var lgContImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/LargeTextContainer.png");
        if (lgContImg) {
            ctx.drawImage(lgContImg, px, py, ps, ps);
        }

        const faceMap = {
            duc:      "./assets/characters/guy1/Face.png",
            muhammed: "./assets/characters/guy3/Face.png",
            mikhail:  "./assets/characters/guy2/Face.png",
        };
        const faceImg = faceMap[key] ? ASSET_MANAGER.getAsset(faceMap[key]) : null;
        if (faceImg) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(px + 6, py + 6, ps - 12, ps - 12, 10);
            ctx.clip();
            ctx.drawImage(faceImg, px + 6, py + 6, ps - 12, ps - 12);
            ctx.restore();
        }

        const tx = px + ps + 24;
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("CHARACTER NAME", tx, py + 8);
        ctx.font = "bold 30px 'The Bold Font', serif";
        ctx.fillText(data.displayName, tx, py + 38);

        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("FRIENDSHIP LEVEL", tx, py + 88);
        const heartCount = GameState.getHearts(key);
        var pinkHeart = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/PinkHeart.png");
        var blueHeart = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/BlueHeart.png");
        for (let i = 0; i < 5; i++) {
            var filled = i < heartCount;
            var hImg = filled ? pinkHeart : blueHeart;
            if (hImg) {
                ctx.save();
                if (!filled) ctx.globalAlpha = 0.3;
                ctx.drawImage(hImg, tx + i * 42, py + 112, 36, 36);
                ctx.restore();
            }
        }

        let sy = py + ps + 40;
        const sectionGap = 36;
        const boxH = 70;

        var smallContImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        const drawSection = (title, content) => {
            ctx.fillStyle = "#4a2a58";
            ctx.font = "bold 22px 'Roboto', sans-serif";
            ctx.fillText(title, r.x + 30, sy);
            sy += 30;
            if (smallContImg) {
                ctx.drawImage(smallContImg, r.x + 30, sy, r.w - 60, boxH);
            }
            ctx.fillStyle = "#3a2a4e";
            ctx.font = "20px 'Roboto', sans-serif";
            wrapText(ctx, content, r.x + 46, sy + 14, r.w - 92, 26);
            sy += boxH + sectionGap;
        };

        drawSection("LIKES",    data.likes);
        drawSection("DISLIKES", data.dislikes);
        drawSection("NOTES",    data.notes);
    }

}
