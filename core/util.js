/** Global Parameters Object */
const params = { };

/**
 * @param {Number} n
 * @returns Random Integer Between 0 and n-1
 */
const randomInt = n => Math.floor(Math.random() * n);

/**
 * @param {Number} r Red Value
 * @param {Number} g Green Value
 * @param {Number} b Blue Value
 * @returns String that can be used as a rgb web color
 */
const rgb = (r, g, b) => `rgba(${r}, ${g}, ${b})`;

/**
 * @param {Number} r Red Value
 * @param {Number} g Green Value
 * @param {Number} b Blue Value
 * @param {Number} a Alpha Value
 * @returns String that can be used as a rgba web color
 */
const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * @param {Number} h Hue
 * @param {Number} s Saturation
 * @param {Number} l Lightness
 * @returns String that can be used as a hsl web color
 */
const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;

/** Creates an alias for requestAnimationFrame for backwards compatibility */
window.requestAnimFrame = (() => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        /**
         * Compatibility for requesting animation frames in older browsers
         * @param {Function} callback Function
         * @param {DOM} element DOM ELEMENT
         */
        ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        });
})();

/**
 * Returns distance from two points
 * @param {Number} p1, p2 Two objects with x and y coordinates
 * @returns Distance between the two points
 */
const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

function drawRoundRect(ctx, x, y, w, h, r) {
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

function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(" ");
    let line = "";
    let cy = y;
    for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > maxW && line.length > 0) {
            ctx.fillText(line.trimEnd(), x, cy);
            line = word + " ";
            cy += lineH;
        } else {
            line = test;
        }
    }
    if (line.trim()) ctx.fillText(line.trimEnd(), x, cy);
}

function wrapTextCentered(ctx, text, cx, cy, maxW, lineH) {
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
    const startY = cy - ((lines.length - 1) * lineH) / 2;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], cx, startY + i * lineH);
    }
}

function getWrappedLines(ctx, text, maxW) {
    const paragraphs = text.split("\n");
    const lines = [];
    for (const para of paragraphs) {
        if (para === "") { lines.push(""); continue; }
        const words = para.split(" ");
        let line = "";
        for (const w of words) {
            const test = line.length ? line + " " + w : w;
            if (ctx.measureText(test).width > maxW && line.length > 0) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }
        }
        if (line.length) lines.push(line);
    }
    return lines;
}