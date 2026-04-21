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

        this.keyHandler = (e) => this._onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        // layout (canvas is 1920x1080)
        // detail panel is wide when no character met; narrow when one is selected
        // Matches the resize pattern in the reference art.
        this.LEFT  = { x: 60,  y: 130,  w: 1180, h: 870 };
        this.RIGHT = { x: 1270, y: 130, w: 590,  h: 870 };

        // 2 column grid for character slots (4 characters total)
        this.GRID_COLS = 2;
        this.GRID_ROWS = 2;
        this.SLOT_SIZE = 250;
        this.SLOT_GAP  = 60;
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
            // eat the click so it doesn't reach the scene below
            this.game.click = null;
        }
    }

    draw(ctx) {
        const W = 1920, H = 1080;

        // underlying scene is already drawn by GameEngine before this overlay.

        // dim overlay
        ctx.fillStyle = `rgba(0,0,0,${0.55 * this.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        // title
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 84px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#ff4fa0";
        ctx.shadowColor = "rgba(255,80,160,0.6)";
        ctx.shadowBlur = 22;
        ctx.fillText("CHARACTERS", W / 2, 70);
        ctx.shadowBlur = 0;

        // left panel background
        this._drawPanel(ctx, this.LEFT);

        // Grid slots
        for (let i = 0; i < this.SLOT_KEYS.length; i++) {
            this._drawSlot(ctx, i);
        }

        // right panel details
        this._drawPanel(ctx, this.RIGHT);
        this._drawDetails(ctx);

        // hint at bottom
        ctx.textAlign = "center";
        ctx.font = "22px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.fillText("Press I or ESC to close", W / 2, H - 30);

        ctx.restore();
    }

    _drawPanel(ctx, r) {
        // eounded pink bordered panel matching the dating sim UI pack
        ctx.fillStyle = "rgba(255, 240, 248, 0.96)";
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 24);
        ctx.fill();
        ctx.strokeStyle = "#ff9ccf";
        ctx.lineWidth = 4;
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 24);
        ctx.stroke();
    }

    _drawSlot(ctx, index) {
        const r = this._slotRect(index);
        const key = this.SLOT_KEYS[index];
        const known = key && GameState.metCharacters[key];
        const isSelected = key === this.selectedKey;
        const isHovered = index === this.hoveredSlot && known;

        // slot background
        ctx.fillStyle = known ? "#f5d8ea" : "#e8e0ec";
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 16);
        ctx.fill();

        // inner shadow / depth (inset square)
        const pad = 18;
        ctx.fillStyle = known ? "#f8e4f1" : "#d8d0dc";
        this._roundRect(ctx, r.x + pad, r.y + pad, r.w - pad * 2, r.h - pad * 2, 10);
        ctx.fill();

        // silhouette or ???
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (known) {
            // generic silhouette (circle + shoulder arc)
            ctx.fillStyle = "#d18ebb";
            const cx = r.x + r.w / 2;
            const cy = r.y + r.h * 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy - 40, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx, cy, 60, 90, 0, Math.PI, 0, true);
            ctx.fill();
        } else {
            ctx.fillStyle = "#8a7a92";
            ctx.font = "bold 64px 'The Bold Font', serif";
            ctx.fillText("?", r.x + r.w / 2, r.y + r.h / 2);
        }

        // selection border
        if (isSelected) {
            ctx.strokeStyle = "#ffc64a";
            ctx.lineWidth = 6;
            this._roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 18);
            ctx.stroke();
        } else if (isHovered) {
            ctx.strokeStyle = "#ff4fa0";
            ctx.lineWidth = 4;
            this._roundRect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 18);
            ctx.stroke();
        }

        // name below slot
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 22px 'The Bold Font', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label = known ? CHARACTER_DATA[key].displayName : "???";
        ctx.fillText(label, r.x + r.w / 2, r.y + r.h + 8);
    }

    _drawDetails(ctx) {
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

        // portrait placeholder (square with silhouette)
        const px = r.x + 30, py = r.y + 30, ps = 220;
        ctx.fillStyle = "#f5d8ea";
        this._roundRect(ctx, px, py, ps, ps, 14);
        ctx.fill();

        const cx = px + ps / 2;
        const cy = py + ps * 0.5;
        ctx.fillStyle = "#d18ebb";
        ctx.beginPath();
        ctx.arc(cx, cy - 40, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy, 60, 90, 0, Math.PI, 0, true);
        ctx.fill();

        // right of portrait: name, friendship hearts
        const tx = px + ps + 24;
        ctx.fillStyle = "#4a2a58";
        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("CHARACTER NAME", tx, py + 8);
        ctx.font = "bold 30px 'The Bold Font', serif";
        ctx.fillText(data.displayName, tx, py + 38);

        ctx.font = "bold 20px 'Roboto', sans-serif";
        ctx.fillText("FRIENDSHIP LEVEL", tx, py + 88);
        // draw 5 hearts
        const heartCount = GameState.getHearts(key);
        for (let i = 0; i < 5; i++) {
            const cx = tx + 20 + i * 40;
            const cy = py + 140;
            this._drawHeart(ctx, cx, cy, 16, i < heartCount ? "#ff4fa0" : "#3a3a5e");
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
            ctx.fillStyle = "#efe0ee";
            this._roundRect(ctx, r.x + 30, sy, r.w - 60, boxH, 10);
            ctx.fill();
            ctx.fillStyle = "#3a2a4e";
            ctx.font = "20px 'Roboto', sans-serif";
            this._wrapText(ctx, content, r.x + 46, sy + 14, r.w - 92, 26);
            sy += boxH + sectionGap;
        };

        drawSection("LIKES",    data.likes);
        drawSection("DISLIKES", data.dislikes);
        drawSection("NOTES",    data.notes);
    }

    _drawHeart(ctx, cx, cy, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        const s = size;
        ctx.moveTo(cx, cy + s * 0.3);
        ctx.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy - s * 0.3);
        ctx.bezierCurveTo(cx - s, cy - s, cx, cy - s * 0.8, cx, cy - s * 0.3);
        ctx.bezierCurveTo(cx, cy - s * 0.8, cx + s, cy - s, cx + s, cy - s * 0.3);
        ctx.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s * 0.3);
        ctx.fill();
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

    _wrapText(ctx, text, x, y, maxW, lineH) {
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