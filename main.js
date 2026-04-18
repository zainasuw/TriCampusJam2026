const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();

// ── Queue assets ───────────────────────────────────────────────────────
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/Button.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/ButtonPressed.png");

// Pre-load everything else so they're ready when scenes need them
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Icons/BackArrow.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Icons/BlueHeart.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Icons/PinkHeart.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Icons/Checkmark.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Icons/Settings.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Dialogue/DialogueContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Dialogue/ReplyBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Dialogue/ReplyBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/ExitPopup/PopUpContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/ExitPopup/BlueBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/ExitPopup/BlueBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/ExitPopup/RedBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/ExitPopup/RedBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/GreenBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/GreenBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/CharacterSheetBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/CharacterDetailsBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/SelectedCharacter.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/UnknownCharacterContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/BottomShadow.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Messaging/MessagingBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/NextBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/NextBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/SettingsBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/VictoryTitleContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/DefeatTitleContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/TextContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtnPressed.png");

// ── Boot ──────────────────────────────────────────────────────────────
ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	gameEngine.init(ctx);
	gameEngine.addEntity(new HomeScreen(gameEngine));
	gameEngine.start();
});

// ═════════════════════════════════════════════════════════════════════
//  HOME SCREEN
//
//  STATE MACHINE:
//    "idle"      — background + title + START button visible, waiting
//    "animating" — user clicked START; title slides up, button slides
//                  down off-screen over ~900ms
//    "done"      — UI fully gone, clean background remains for your
//                  partner to place a character sprite on top
// ═════════════════════════════════════════════════════════════════════
class HomeScreen {
	constructor(game) {
		this.game = game;
		this.removeFromWorld = false;

		// Assets
		this.bg     = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
		this.btnImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/Button.png");
		this.btnPrs = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/ButtonPressed.png");

		// Canvas dimensions
		this.W = this.game.ctx.canvas.width;
		this.H = this.game.ctx.canvas.height;

		// ── Button geometry ─────────────────────────────────────────
		// Slightly bigger than before as requested
		this.btnW = 560;
		this.btnH = 100;
		this.btnX = this.W / 2 - this.btnW / 2;  // horizontally centred
		this.btnY = this.H * 0.4;                  // resting Y position (moved up)

		// ── Title geometry ──────────────────────────────────────────
		// Title draws at titleY; starts at its resting position
		this.titleY      = 300;  // centre-line of the main title text
		this.subtitleY   = 410;  // centre-line of the subtitle text

		// ── Animation state ─────────────────────────────────────────
		this.state        = "idle";   // "idle" | "animating" | "done"
		this.animTimer    = 0;
		this.animDuration = 0.9;      // seconds for the slide animation

		// How many pixels each element travels during animation
		this.titleSlide  = -420;      // title slides UP  (negative = up)
		this.btnSlide    = 400;       // button slides DOWN off-screen

		// Current offsets (applied on top of resting positions)
		this.titleOffset = 0;
		this.btnOffset   = 0;
		this.opacity     = 1;         // fades UI out as it animates away

		// ── Hover / press ────────────────────────────────────────────
		this.hovered = false;
		this.pressed = false;
	}

	// ── Helpers ───────────────────────────────────────────────────────
	isHit(mx, my) {
		const by = this.btnY + this.btnOffset;
		return mx >= this.btnX && mx <= this.btnX + this.btnW &&
			my >= by        && my <= by + this.btnH;
	}

	// Ease-out cubic  t ∈ [0,1] → [0,1]
	easeOut(t) { return 1 - Math.pow(1 - t, 3); }

	// ── Update ────────────────────────────────────────────────────────
	update() {
		const dt    = this.game.clockTick;
		const mouse = this.game.mouse;
		const click = this.game.click;

		if (this.state === "idle") {
			// Live hover check — no click buffering needed
			this.hovered = mouse ? this.isHit(mouse.x, mouse.y) : false;

			if (click && this.isHit(click.x, click.y)) {
				this.pressed = true;
				this.state   = "animating";
				this.game.click = null;
			}

		} else if (this.state === "animating") {
			this.animTimer += dt;
			const t = Math.min(this.animTimer / this.animDuration, 1);
			const e = this.easeOut(t);

			this.titleOffset = this.titleSlide * e;
			this.btnOffset   = this.btnSlide   * e;
			this.opacity     = 1 - e;

			if (t >= 1) {
				this.state = "done";
				// ── Hand off to your partner's scene here ──────────
				// When the title/button are gone this entity stays alive
				// but only draws the background.  Your partner's character
				// sprite entity can now be added:
				//   gameEngine.addEntity(new CharacterSprite(gameEngine));
			}
		}
		// "done" — nothing left to update in this entity
	}

	// ── Draw ──────────────────────────────────────────────────────────
	draw(ctx) {
		// 1. Background always draws at full opacity
		if (this.bg) {
			ctx.drawImage(this.bg, 0, 0, this.W, this.H);
		} else {
			ctx.fillStyle = "#fce4f0";
			ctx.fillRect(0, 0, this.W, this.H);
		}

		// Nothing else to draw once animation completes
		if (this.state === "done") return;

		// 2. Apply shared opacity for the UI layer
		ctx.save();
		ctx.globalAlpha = this.opacity;

		// 3. Title  ── slides UP
		const curTitleY    = this.titleY    + this.titleOffset;
		const curSubtitleY = this.subtitleY + this.titleOffset;

		ctx.textAlign = "center";

		// Main title
		ctx.font = "bold 108px 'The Bold Font', Georgia, serif";
		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = "rgba(220, 80, 140, 0.85)";
		ctx.shadowBlur  = 28;
		ctx.fillText("DATING SIM!", this.W / 2, curTitleY);

		// Subtitle
		ctx.shadowBlur = 0;
		ctx.font = "italic 44px 'Roboto', Georgia, sans-serif";
		ctx.fillStyle = "#d4457a";
		ctx.fillText("It's a Feature, Not a Bug", this.W / 2, curSubtitleY);

		// 4. Button  ── slides DOWN
		const curBtnY = this.btnY + this.btnOffset;
		const sprite  = this.pressed ? this.btnPrs : this.btnImg;

		if (sprite) {
			ctx.drawImage(sprite, this.btnX, curBtnY, this.btnW, this.btnH);
		} else {
			// Fallback rect
			ctx.fillStyle = this.hovered ? "#cc5599" : "#e070aa";
			ctx.fillRect(this.btnX, curBtnY, this.btnW, this.btnH);
		}

		// Button label
		ctx.font = "bold 32px 'The Bold Font', 'Roboto', sans-serif";
		ctx.fillStyle = "#ffffff";
		ctx.shadowBlur = 0;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("START NEW GAME", this.btnX + this.btnW / 2, curBtnY + this.btnH / 2);

		// Hover glow ring around button
		if (this.hovered && this.state === "idle") {
			ctx.strokeStyle = "rgba(255, 180, 220, 0.7)";
			ctx.lineWidth   = 4;
			ctx.strokeRect(this.btnX - 4, curBtnY - 4, this.btnW + 8, this.btnH + 8);
		}

		ctx.restore();
	}
}