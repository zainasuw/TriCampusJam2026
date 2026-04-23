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