const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();
const MUSIC = new Music();

// queue assets
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/Button.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/HomeScreen/ButtonPressed.png");

// preload everything else so they are ready when scenes need them
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
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/MasterVolumeContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/SoundSettingsContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/VolumeBarEmpty.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/VolumeFill.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/VolumeKnob.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/Switch.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Settings/SwitchBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Messaging/MessageBubble.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Messaging/NotificationBackground.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/LargeTextContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Messaging/CharacterContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/VictoryTitleContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/DefeatTitleContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/TextContainer.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/ContinueBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/Background.jpg");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/BlueBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/BlueBtnPressed.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/RedBtn.png");
ASSET_MANAGER.queueDownload("./assets/DatingGameUI/VictoryOrDefeat/RedBtnPressed.png");


const GUY_EXPRESSIONS = ["Neutral", "Angry", "Sad", "Surprised", "Relaxed", "Blink"];
for (const expr of GUY_EXPRESSIONS) {
	ASSET_MANAGER.queueDownload(`./assets/characters/guy1/${expr}.png`);
	ASSET_MANAGER.queueDownload(`./assets/characters/guy2/${expr}.png`);
	ASSET_MANAGER.queueDownload(`./assets/characters/guy3/${expr}.png`);
}
ASSET_MANAGER.queueDownload("./assets/characters/guy1/Face.png");
ASSET_MANAGER.queueDownload("./assets/characters/guy2/Face.png");
ASSET_MANAGER.queueDownload("./assets/characters/guy3/Face.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/face.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/neutral.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/angry.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/happy.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/sad.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/smiling.png");
ASSET_MANAGER.queueDownload("./assets/characters/tutorial/surprised.png");

const GIRL_EXPRESSIONS = ["Natu", "Smiling", "Angry", "Sad", "Sad_tears",
	"Surprised", "neutral_pose", "Close_blushing", "open_blushing", "FullBlink", "BaseLine"];
for (const expr of GIRL_EXPRESSIONS) {
	ASSET_MANAGER.queueDownload(`./assets/characters/girl1/${expr}.png`);
}
ASSET_MANAGER.queueDownload("./assets/characters/girl1/Face.png");

// VFX sprite sheets
ASSET_MANAGER.queueDownload("./assets/vfx/hearts_rising.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_crumble.png");
ASSET_MANAGER.queueDownload("./assets/vfx/analysis_error.png");
ASSET_MANAGER.queueDownload("./assets/vfx/hearts_sparkle.png");
ASSET_MANAGER.queueDownload("./assets/vfx/touch_effect.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_stamp.png");
ASSET_MANAGER.queueDownload("./assets/vfx/burning_heart.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_explosion.png");
ASSET_MANAGER.queueDownload("./assets/vfx/frozen_heart.png");
ASSET_MANAGER.queueDownload("./assets/vfx/distorted_heart.png");
ASSET_MANAGER.queueDownload("./assets/vfx/analysis.png");
ASSET_MANAGER.queueDownload("./assets/vfx/analysis_success.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_fireworks.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_pulse.png");
ASSET_MANAGER.queueDownload("./assets/vfx/heart_form.png");
ASSET_MANAGER.queueDownload("./assets/vfx/pink_burst.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");
	gameEngine.init(ctx);
	gameEngine.addEntity(new HomeScreen(gameEngine));
	gameEngine.start();
});

class HomeScreen {
	constructor(game) {
		this.game = game;
		this.removeFromWorld = false;

		// assets
		this.bg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/HomeScreenBackground.jpg");
		this.btnImg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/Button.png");
		this.btnPrs = ASSET_MANAGER.getAsset("./assets/DatingGameUI/HomeScreen/ButtonPressed.png");

		// canvas dimensions
		this.W = this.game.ctx.canvas.width;
		this.H = this.game.ctx.canvas.height;

		// Button Geometry
		this.btnW = 560;
		this.btnH = 100;
		this.btnX = this.W / 2 - this.btnW / 2;
		this.btnY = this.H * 0.4;

		// settings gear button bottom right corner green
		this.gearBtn = {
			x: this.W - 180,
			y: this.H - 120,
			w: 140,
			h: 90,
		};
		this.gearHovered = false;
		this.gearPressed = false;

		// title geometry
		this.titleY = 300;
		this.subtitleY = 410;

		// Animation state
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

		// kick off menu music will be silent until first user gesture unlocks audio context AudioManager auto play it
		MUSIC.playMenuMusic();
	}

	isHit(mx, my) {
		const by = this.btnY + this.btnOffset;
		return mx >= this.btnX && mx <= this.btnX + this.btnW &&
			my >= by && my <= by + this.btnH;
	}

	isGearHit(mx, my) {
		const g = this.gearBtn;
		return mx >= g.x && mx <= g.x + g.w &&
			my >= g.y && my <= g.y + g.h;
	}

	easeOut(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	update() {
		const dt = this.game.clockTick;
		const mouse = this.game.mouse;
		const click = this.game.click;

		if (this.state === "idle") {
			this.hovered = mouse ? this.isHit(mouse.x, mouse.y) : false;
			this.gearHovered = mouse ? this.isGearHit(mouse.x, mouse.y) : false;

			if (click && this.isGearHit(click.x, click.y)) {
				// open Settings as an overlay, home stays alive beneath it.
				MUSIC.unlock();

				this.gearPressed = true;
				setTimeout(() => {
					this.gearPressed = false;
				}, 120);
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
			const t = Math.min(this.animTimer / this.animDuration, 1);
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
				// background music start has been moved to NameInputScene so it no longer interrupts the BSOD typing sounds
				MUSIC.stopAllMusic();

				this.game.addEntity(new GlitchIntroScene(this.game));
				this.removeFromWorld = true;
			}
		}
	}

	draw(ctx) {
		if (this.bg) {
			ctx.drawImage(this.bg, 0, 0, this.W, this.H);
		}

		if (this.state === "done") {
			ctx.fillStyle = `rgba(0,0,0,${Math.min(this.transitionAlpha, 1)})`;
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

		const elapsedTime = (Date.now() - (this.startTime || Date.now())) / 1000;
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
		const sprite = this.pressed ? this.btnPrs : this.btnImg;

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

		// green gear button bottom right corner opens SettingsScene overlay
		this.drawGearButton(ctx);

		ctx.restore();
	}

	drawGearButton(ctx) {
		var g = this.gearBtn;
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
}
