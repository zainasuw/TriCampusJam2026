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
        this.underlying = underlying;  // scene to render beneath
        this.removeFromWorld = false;

        // start with the first MET character selected; fall back to 'duc' slot
        this.selectedKey = null;
        for (const k of ["duc", "muhammed", "mikhail"]) {
            if (GameState.metCharacters[k]) { this.selectedKey = k; break; }
        }

        // if the player has met no one yet, select first slot but show ??? data
        this.hoveredSlot = -1;

        this.fadeAlpha = 0;
        this.fadeDir = 1;  // 1 = opening, -1 = closing
        this.closing = false;

        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        // layout (canvas is 1920x1080)
        // detail panel is wide when no character met; narrow when one is selected
        // Matches the resize pattern in the reference art.
        this.LEFT  = { x: 30,  y: 110,  w: 740, h: 900 };
        this.RIGHT = { x: 790, y: 110, w: 1100, h: 900 };

        // 2 column grid for character slots (4 characters total)
        this.GRID_COLS = 2;
        this.GRID_ROWS = 2;
        this.SLOT_SIZE = 180;
        this.SLOT_GAP  = 40;
        this.GRID_START = { x: 130, y: 290 };

        this.SLOT_KEYS = ["duc", "muhammed", "mikhail", "tutorial"];
    }

    onKey(e) {
        if (this.closing) return;
        if (e.key === "i" || e.key === "I" || e.key === "Escape") {
            this.closing = true;
            this.fadeDir = -1;
        }
    }

    slotRect(index) {
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

        // Fade animation
        this.fadeAlpha += this.fadeDir * dt * 5;
        this.fadeAlpha = Math.max(0, Math.min(1, this.fadeAlpha));

        if (this.closing && this.fadeAlpha <= 0) {
            document.removeEventListener("keydown", this.keyHandler);
            this.removeFromWorld = true;
            return;
        }

        // ignore interaction during open/close transitions
        if (this.fadeAlpha < 1 || this.closing) {
            this.game.click = null; // consume so underlying doesn't see it either
            return;
        }

        const mouse = this.game.mouse;
        const click = this.game.click;

        this.hoveredSlot = -1;
        if (mouse) {
            for (let i = 0; i < this.SLOT_KEYS.length; i++) {
                const r = this.slotRect(i);
                if (mouse.x >= r.x && mouse.x <= r.x + r.w &&
                    mouse.y >= r.y && mouse.y <= r.y + r.h) {
                    this.hoveredSlot = i;
                    break;
                }
            }
        }

        if (click) {
            for (let i = 0; i < this.SLOT_KEYS.length; i++) {
                const r = this.slotRect(i);
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
            // eat the click so it doesn't reach the scene below
            this.game.click = null;
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // Dim overlay - underlying scene is already drawn by GameEngine before this overlay.
        ctx.fillStyle = `rgba(0,0,0,${0.55 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // title
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font'";
        ctx.fillStyle = "#ff4fa0";
        ctx.shadowColor = "rgba(255, 80, 160, 0.6)";
        ctx.shadowBlur = 22;
        ctx.fillText("CHARACTERS", W / 2, 70);
        ctx.shadowBlur = 0;

        // left panel background
        this.drawPanel(ctx, this.LEFT);
        this.drawPanel(ctx, this.RIGHT);

        // Grid slots
        for (let i = 0; i < this.SLOT_KEYS.length; i++) {
            this.drawSlot(ctx, i);
        }

        this.drawDetails(ctx);

        // hint at bottom
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
        const r = this.slotRect(index);
        const key = this.SLOT_KEYS[index];
        const known = key && GameState.metCharacters[key];
        const isSelected = key === this.selectedKey;


        //select asset pack
        let assetPath = "./assets/DatingGameUI/CharacterScreen/UnknownCharacterContainer.png";
        if (isSelected) {
            assetPath = "./assets/DatingGameUI/CharacterScreen/SelectedCharacter.png";
        } else if (known) {
            assetPath = "./assets/DatingGameUI/CharacterScreen/CharacterContainer.png";
        }
        //container
        const slotImg = ASSET_MANAGER.getAsset(assetPath);
        if (slotImg) {
            ctx.drawImage(slotImg, r.x, r.y,r.w, r.h);
        }
        if (known) {
            var folderMap = {duc: "guy1", muhammed: "guy3", mikhail: "guy2"};
            var folder = folderMap[key];
            var faceImg = folder ? ASSET_MANAGER.getAsset(`./assets/characters/${folder}/Face.png`) : null;

            if (faceImg) {
                ctx.drawImage(faceImg, r.x + 20, r.y + 20, r.w - 40, r.h - 40);
            }
        }



        // name below slot
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 22px 'The Bold Font', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = known ? CHARACTER_DATA[key].displayName : "???";
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

        // portrait placeholder
        const px = r.x + 30, py = r.y + 30, ps = 220;
        var detailBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");

        if (detailBg) ctx.drawImage(detailBg,px,py,ps,ps);

        var folderMap = {duc: "guy1", muhammed: "guy3", mikhail: "guy2"};
        var folder = folderMap[key];
        var detailFace =  folder ?ASSET_MANAGER.getAsset(`./assets/characters/${folder}/Face.png`) : null;
        if (detailFace) {
            ctx.drawImage(detailFace, px + 10, py +10, ps -20,ps -20)
        }

        // right of portrait: name, friendship hearts
        const tx = px + ps + 24;
        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("CHARACTER NAME", tx, py + 8);
        ctx.font = "bold 30px 'The Bold Font', serif";
        ctx.fillText(data.displayName, tx, py + 38);

        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("FRIENDSHIP LEVEL", tx, py + 88);

        var heartCount = GameState.getHearts(key);
        // Use assets to draw hearts
            for (var i = 0; i < 5; i ++) {
                var heartAsset = i < heartCount
                    ? "./assets/DatingGameUI/Icons/PinkHeart.png"
                    : "./assets/DatingGameUI/Icons/BlueHeart.png";
                var hearImg = ASSET_MANAGER.getAsset(heartAsset);
                if (hearImg) ctx.drawImage(hearImg, tx + (i * 45), py + 120, 40, 40);
            }


        // stat sections
        let sy = py + ps + 40;
        const sectionGap = 36;
        const boxH = 70;

        const drawSection = (title, content) => {
            ctx.fillStyle = "#4a2a58";
            ctx.font = "bold 22px 'Roboto', sans-serif";
            ctx.fillText(title, r.x + 30, sy);
            sy += 30;

            var textBox = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/LargeTextContainer.png");
            if (textBox) ctx.drawImage(textBox, r.x + 30, sy, r.w -60, boxH);


            ctx.fillStyle = "#3a2a4e";
            ctx.font = "20px 'Roboto', sans-serif";
            this.wrapText(ctx, content, r.x + 46, sy + 14, r.w - 92, 26);
            sy += boxH + sectionGap;
        };

        drawSection("LIKES",    data.likes);
        drawSection("DISLIKES", data.dislikes);
        drawSection("NOTES",    data.notes);
    }



    wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(" ");
        let line = "";
        let cy = y;
        for (const w of words) {
            const test = line + w + " ";
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line.trimEnd(), x, cy);
                line = w + " ";
                cy += lineH;
            } else {
                line = test;
            }
        }
        if (line.trim()) ctx.fillText(line.trimEnd(), x, cy);
    }
}