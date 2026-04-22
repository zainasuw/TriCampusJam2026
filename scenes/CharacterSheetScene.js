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

const CHARACTER_FOLDER = {
    duc: "guy1",
    muhammed: "guy2",
    mikhail: "guy3",
};

class CharacterSheetScene {
    constructor(game, underlying) {
        this.game = game;
        this.underlying = underlying;
        this.removeFromWorld = false;

        // start with the first MET character selected. if nothing met yet, leave selection null and the right panel
        // shows "talk to someone" message
        this.selectedKey = null;
        for (const k of ["duc", "muhammed", "mikhail", "tutorial"]) {
            if (GameState.metCharacters[k]) {
                this.selectedKey = k;
                break;
            }
        }

        // if the player has met no one yet, select first slot but show ??? data
        this.hoveredSlot = -1;

        this.fadeAlpha = 0;
        this.fadeDir = 1;
        this.closing = false;

        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        // canvas is 1920x1080. left panel holds the 2x2 grid, right panel holds detail card
        this.LEFT  = { x: 30,  y: 110, w: 740,  h: 900 };
        this.RIGHT = { x: 790, y: 110, w: 1100, h: 900 };

        // slot grid geometry. 2 cols x 2 rows of 180px tiles. gap between cols, plus extra vertical room between rows
        // to fit the name label under each tile.
        this.SLOT_SIZE = 180;
        this.SLOT_GAP_X = 80;
        this.SLOT_GAP_Y = 110;

        const gridW = this.SLOT_SIZE * 2 + this.SLOT_GAP_X;
        const gridH = this.SLOT_SIZE * 2 + this.SLOT_GAP_Y;
        // center the grid inside the left panel both ways. nudge down a touch to clear the panel art's top trim
        this.GRID_START = {
            x: this.LEFT.x + (this.LEFT.w - gridW) / 2,
            y: this.LEFT.y + (this.LEFT.h - gridH) / 2 + 30,
        };

        this.SLOT_KEYS = ["duc", "muhammed", "mikhail", "tutorial"];

        // how much padding the panel art has on each side. text boxes and portraits get draw inside this inset so they
        // dont bleed past the pink frame
        this.RIGHT_INSET = 140;
    }

    onKey(e) {
        if (this.closing) return;
        if (e.key === "i" || e.key === "I" || e.key === "Escape") {
            this.closing = true;
            this.fadeDir = -1;
        }
    }

    slotRect(index) {
        const col = index % 2;
        const row = Math.floor(index / 2);
        return {
            x: this.GRID_START.x + col * (this.SLOT_SIZE + this.SLOT_GAP_X),
            y: this.GRID_START.y + row * (this.SLOT_SIZE + this.SLOT_GAP_Y),
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

        // ignore interaction during open/close transitions. eat clicks so the scene below doesnt see them either
        if (this.fadeAlpha < 1 || this.closing) {
            this.game.click = null;
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
                    break;
                }
            }
            // eat the click no matter what so it doesnt fall through to the dialogue scene below
            this.game.click = null;
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // dim whatever is underneath. UnderlyingScene was already painted by the engine before us
        ctx.fillStyle = `rgba(0,0,0,${0.55 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // title strip at the top
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font'";
        ctx.fillStyle = "#ff4fa0";
        ctx.shadowColor = "rgba(255, 80, 160, 0.6)";
        ctx.shadowBlur = 22;
        ctx.fillText("CHARACTERS", W / 2, 70);
        ctx.shadowBlur = 0;

        // panel backgrounds
        const leftBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterSheetBackground.png");
        if (leftBg) ctx.drawImage(leftBg, this.LEFT.x, this.LEFT.y, this.LEFT.w, this.LEFT.h);
        const rightBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterDetailsBackground.png");
        if (rightBg) ctx.drawImage(rightBg, this.RIGHT.x, this.RIGHT.y, this.RIGHT.w, this.RIGHT.h);

        // grid slots
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

        // pick the right slot frame: selected > known > locked silhouette
        let assetPath = "./assets/DatingGameUI/CharacterScreen/UnknownCharacterContainer.png";
        if (isSelected) {
            assetPath = "./assets/DatingGameUI/CharacterScreen/SelectedCharacter.png";
        } else if (known) {
            assetPath = "./assets/DatingGameUI/CharacterScreen/CharacterContainer.png";
        }

        const slotImg = ASSET_MANAGER.getAsset(assetPath);
        if (slotImg) ctx.drawImage(slotImg, r.x, r.y, r.w, r.h);

        if (known) {
            // tutorial uses a sprite sheet, the rest are single Face.png files. either way
            // draw the face using the same padding/offset algorithm as the dialogue portrait
            const ip = 18;
            const faceXOffset = 0; // matches FACE_X_OFFSET in DialogueScene
            const playerFaceYOffset = -22; // matches PLAYER_FACE_Y_OFFSET in DialogueScene
            const dx = r.x + ip + faceXOffset + 10;
            const dy = r.y + ip + playerFaceYOffset + 40;
            const dw = r.w - ip * 3.5;
            const dh = r.h - ip * 3.5;
            this.drawCharacterFace(ctx, key, dx, dy, dw, dh);
        }

        // name label below the slot
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 22px 'The Bold Font', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        let label = "???";
        if (known) label = CHARACTER_DATA[key].displayName;
        ctx.fillText(label, r.x + r.w / 2, r.y + r.h + 12);
    }

    // central face draw. handles tutorial's 3 frame sprite sheet vs the static Face.png used by everyone else.
    // always draws frame 0 here since this is the I menu, not the dialogue
    drawCharacterFace(ctx, key, dx, dy, dw, dh) {
        if (key === "tutorial") {
            const sheet = ASSET_MANAGER.getAsset("./assets/characters/tutorial/face.png");
            if (!sheet) return;
            // sheet is 3 frames horizontal, 500 each, total 1500x500. always render the eyes-open frame
            const frameW = sheet.width / 3;
            const frameH = sheet.height;
            ctx.drawImage(sheet, 0, 0, frameW, frameH, dx, dy, dw, dh);
            return;
        }
        const folder = CHARACTER_FOLDER[key];
        if (!folder) return;
        const faceImg = ASSET_MANAGER.getAsset(`./assets/characters/${folder}/Face.png`);
        if (faceImg) ctx.drawImage(faceImg, dx, dy, dw, dh);
    }

    drawDetails(ctx) {
        const r = this.RIGHT;
        const key = this.selectedKey;
        let data = null;
        if (key) data = CHARACTER_DATA[key];

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

        // portrait sits in the upper-left of the detail panel, with all numbers anchored to RIGHT INSET
        const ps = 220;
        const px = r.x + this.RIGHT_INSET;
        const py = r.y + this.RIGHT_INSET;
        const portraitFrame = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");
        if (portraitFrame) ctx.drawImage(portraitFrame, px, py, ps, ps);

        // face inside the portrait frame, using the same padding/offset algorithm as DialogueScene
        const ip2 = 18;
        const faceXOffset2 = 0; // same as FACE_X_OFFSET
        const playerFaceYOffset2 = -22; // same as PLAYER_FACE_Y_OFFSET
        const dx2 = px + ip2 + faceXOffset2 + 10;
        const dy2 = py + ip2 + playerFaceYOffset2 + 40;
        const dw2 = ps - ip2 * 4;
        const dh2 = ps - ip2 * 4;
        this.drawCharacterFace(ctx, key, dx2, dy2, dw2, dh2);

        // text column to the right of the portrait
        const tx = px + ps + 30;
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("CHARACTER NAME", tx, py + 8);
        ctx.font = "bold 30px 'The Bold Font', serif";
        ctx.fillText(data.displayName, tx, py + 38);

        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("FRIENDSHIP LEVEL", tx, py + 88);

        // friendship row. tutorial gets ???? marks instead of hearts since the player isnt supposed to know hes the
        // secret romanceable until late game
        if (data.isTutorial) {
            ctx.font = "bold 44px 'The Bold Font', serif";
            ctx.fillStyle = "#a06090";
            ctx.fillText("? ? ? ? ?", tx, py + 124);
        } else {
            const heartCount = GameState.getHearts(key);
            for (let i = 0; i < 5; i++) {
                let heartAsset = "./assets/DatingGameUI/Icons/BlueHeart.png";
                if (i < heartCount) heartAsset = "./assets/DatingGameUI/Icons/PinkHeart.png";
                const heartImg = ASSET_MANAGER.getAsset(heartAsset);
                if (heartImg) ctx.drawImage(heartImg, tx + (i * 45), py + 120, 40, 40);
            }
        }

        // stat section Likes / Dislikes / Notes. boxes are inset from the panel edges by RIGHT_INSET on each side so
        // they sit cleanly inside the pink frame instead of bleeding past it
        let sy = py + ps + 50;
        const sectionGap = 26;
        const boxH = 80;
        const boxX = r.x + this.RIGHT_INSET;
        const boxW = r.w - this.RIGHT_INSET * 2;

        const drawSection = (title, content) => {
            ctx.fillStyle = "#4a2a58";
            ctx.font = "bold 22px 'Roboto', sans-serif";
            ctx.fillText(title, boxX, sy);
            sy += 30;

            const textBox = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/LargeTextContainer.png");
            if (textBox) ctx.drawImage(textBox, boxX, sy, boxW, boxH);

            ctx.fillStyle = "#3a2a4e";
            ctx.font = "20px 'Roboto', sans-serif";
            // text wraps inside the box with its own padding so chars dont kiss the rounded corners
            this.wrapText(ctx, content, boxX + 22, sy + 18, boxW - 44, 26);
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