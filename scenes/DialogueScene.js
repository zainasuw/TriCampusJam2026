const FACE_Y_OFFSET = -22;          // negative pulls the face up into the container. tweak til it looks centered
const FACE_X_OFFSET = 0;            // positive shifts right
const PLAYER_FACE_Y_OFFSET = -22;
const CHAR_SLIDE_DURATION = 0.55;   // lerp time for ENTERING and EXITING in seconds, speed or slow down
const CHAR_OFFSCREEN_X = 1300;      // pixels past right edge where characters spawn
const NEXT_ARROW_Y = 855;           // moved up from 890 so it doesnt overlap the dialogue box

// guy2 = Muhammed, guy3 = Mikhail art. previous versions had this flipped which is why the wrong faces showed up over the wrong names
const SPEAKER_FOLDER = {
    "ĐỨC": "guy1",
    "MUHAMMED": "guy2",
    "MIKHAIL": "guy3",
};

const SPEAKER_FACE = {
    "ĐỨC": "./assets/characters/guy1/Face.png",
    "MUHAMMED": "./assets/characters/guy2/Face.png",
    "MIKHAIL": "./assets/characters/guy3/Face.png",
};

// charPhase state machine for the bachelor sprite sliding, off no character on screen, entering  sliding in from off
// screen right toward target X, speaking  fully arrived. dialogue box and text are allowed to render exiting
// sliding back out to the right. when done, load any pending queued node
const CHAR_PHASE_OFF = "off";
const CHAR_PHASE_ENTERING = "entering";
const CHAR_PHASE_SPEAKING = "speaking";
const CHAR_PHASE_EXITING = "exiting";

class DialogueScene {
    constructor(game, startNodeId) {
        this.game = game;
        this.removeFromWorld = false;
        this.paused = false;  // true while CharacterSheetScene or SettingsScene overlay is open

        const data = window.DIALOGUE_DATA;
        this.data = data;

        // typing effect state
        this.displayText = "";
        this.fullText = "";
        this.charIndex = 0;
        this.typingTimer = 0;
        this.typingSpeed = 0.025;

        // dialogue state
        // phases typing,idle,choice,system,system_pause,end
        this.phase = "typing";
        this.currentSpeaker = "";
        this.currentPortrait = "";
        this.currentChoices = null;
        this.nextNodeId = null;
        this.currentNode = null;
        this.currentNodeId = null;

        // system screen state
        this.systemLines = [];
        this.systemLineIndex = 0;
        this.systemLineTimer = 0;
        this.pauseTimer = 0;
        this.pendingNextForSystem = null;

        // muhammed loop bug. text is shown 3 times, fresh boxes, click 3 times to escape
        this.muhammedLoopPressed = 0;

        // duc reboot shake
        this.ducShakeTimer = 0;
        this.ducShakeDuration = 0.6;

        // sprites
        this.currentGuySprite = null;
        this.currentGirlSprite = null;
        this.breathTimer = 0;
        this.charOpacity = 0;
        this.playerOpacity = 0;

        // tutorial blink driver. variable timing per cycle so it doesnt feel like a metronome
        // frames 0 = open 1 = half 2 = closed
        this.tutorialBlinkFrame = 0;
        this.tutorialBlinkPhase = "open";   // open, closing, closed, opening
        this.tutorialBlinkTimer = 0;
        this.tutorialNextBlinkIn = this.rollNextBlinkDelay();

        // character entrance state machine
        this.charPhase = CHAR_PHASE_OFF;
        this.charLerpT = 0;
        this.charLerpDuration = CHAR_SLIDE_DURATION;
        this.charCurrentX = CHAR_OFFSCREEN_X;
        this.charTargetX = 0;
        // node id queued up during an EXITING transition. cleared once loaded
        this.pendingNodeId = null;

        // UI state
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;
        this.nextBtnPressed = false;
        this.replyBtnPressedIndex = -1;

        // gear button bottom right corner
        this.gearBtn = {x: 1920 - 180, y: 1080 - 120, w: 140, h: 90};
        this.gearHovered = false;
        this.gearPressed = false;

        // scene fades
        this.fadeAlpha = 1;
        this.fadingIn = true;
        this.fadingOut = false;
        this.fadeOutAlpha = 0;
        this.fadeOutTarget = null;

        // layout. canvas is 1920x1080
        this.CHAR_BOX = {x: 80, y: 760, w: 210, h: 210};
        this.DLG = {x: 60, y: 740, w: 1800, h: 250};
        this.NEXT = {x: 1730, y: NEXT_ARROW_Y, w: 100, h: 88};
        this.SPEAKER = {x: 60, y: 660, w: 380, h: 70};

        // reply buttons
        this.REPLY_W = 820;
        this.REPLY_H = 110;
        this.REPLY_GAP = 22;

        // vfx sprite sheet definitions
        this.VFX_DEFS = {
            hearts_rising: {asset: "./assets/vfx/hearts_rising.png", cols: 5, rows: 4, total: 20, fps: 15},
            heart_crumble: {asset: "./assets/vfx/heart_crumble.png", cols: 5, rows: 3, total: 15, fps: 15},
            analysis_error: {asset: "./assets/vfx/analysis_error.png", cols: 5, rows: 3, total: 15, fps: 15},
            hearts_sparkle: {asset: "./assets/vfx/hearts_sparkle.png", cols: 5, rows: 2, total: 10, fps: 15},
            touch_effect: {asset: "./assets/vfx/touch_effect.png", cols: 5, rows: 3, total: 15, fps: 15},
            heart_pulse: {asset: "./assets/vfx/heart_pulse.png", cols: 5, rows: 4, total: 20, fps: 15},
            heart_form: {asset: "./assets/vfx/heart_form.png", cols: 5, rows: 5, total: 25, fps: 15},
            pink_burst: {asset: "./assets/vfx/pink_burst.png", cols: 5, rows: 3, total: 15, fps: 15},
            distorted_heart: {asset: "./assets/vfx/distorted_heart.png", cols: 5, rows: 4, total: 20, fps: 15},
        };
        this.activeVFX = [];

        // I-key handler
        this.keyHandler = (e) => this.onKey(e);
        document.addEventListener("keydown", this.keyHandler);

        this.loadNode(startNodeId || data.start);
    }

    // tutorial blinks at random intervals. mostly 2-5 seconds between blinks, occasional double blink
    rollNextBlinkDelay() {
        // 15% chance of a quick re-blink, otherwise normal pause
        if (Math.random() < 0.15) return 0.25 + Math.random() * 0.4;
        return 2.0 + Math.random() * 3.5;
    }

    onKey(e) {
        if (this.fadingIn || this.fadingOut || this.paused) return;

        if (e.key === "i" || e.key === "I") {
            this.paused = true;
            this.game.addEntity(new CharacterSheetScene(this.game, this));
        } else if (e.key === "s" || e.key === "S") {
            // quick keyboard shortcut to open Settings
            this.paused = true;
            this.game.addEntity(new SettingsScene(this.game, this));
        }
    }

    sub(text) {
        return text.replace(/{PLAYER_NAME}/g, GameState.playerName);
    }

    remapForDay(nodeId) {
        const match = nodeId.match(/^(duc|muhammed|mikhail)_day1_intro$/);
        if (!match) return nodeId;
        const who = match[1];
        GameState.visitCounts[who]++;
        let interactionNum = GameState.visitCounts[who];
        if (interactionNum > 3) interactionNum = 3;
        return `${who}_day${interactionNum}_intro`;
    }

    loadNode(nodeId) {
        if (this.phase === "system" || this.phase === "system_pause") {
            MUSIC.stopTyping();
        }

        if (!nodeId) {
            this.phase = "end";
            return;
        }

        nodeId = this.remapForDay(nodeId);

        if (nodeId === "tutorialDebrief") {
            this.handleDebrief();
            return;
        }

        if (nodeId === "tutorial_morning" && GameState.visitedToday) {
            this.loadNode("dayEnd");
            return;
        }

        if (nodeId === "dayEnd") {
            this.handleDayEnd();
            return;
        }

        const node = this.data.nodes[nodeId];
        if (!node) {
            console.warn("missing dialogue node:", nodeId);
            this.phase = "end";
            return;
        }

        // figure out the new portrait, portrait controls which sprite is on screen (tutorial,duc, muhammed, mikhail)
        // so we key entrance/exit off of THAT not off speaker name tutorial's first node uses speaker "???" but
        // portrait "tutorial" so the second node where the label flips to "TUTORIAL" doesnt cause an unnecessary
        // slide cycle.
        let newPortrait = "";
        if (node.type !== "system" && node.portrait) newPortrait = node.portrait;

        const portraitChanged = newPortrait !== this.currentPortrait;
        const haveSomeoneOnScreen = this.currentPortrait !== "" && this.charPhase !== CHAR_PHASE_OFF;
        if (portraitChanged && haveSomeoneOnScreen && newPortrait !== "") {
            this.pendingNodeId = nodeId;
            this.charPhase = CHAR_PHASE_EXITING;
            this.charLerpT = 0;
            return;
        }
        // transitioning into a system screen also clears whoever is on screen
        if (node.type === "system" && haveSomeoneOnScreen) {
            this.pendingNodeId = nodeId;
            this.charPhase = CHAR_PHASE_EXITING;
            this.charLerpT = 0;
            return;
        }

        this.currentNodeId = nodeId;
        this.currentNode = node;

        // muhammed loop counter resets per node load
        this.muhammedLoopPressed = 0;

        if (node.type === "system") {
            this.phase = "system";
            this.systemLines = node.lines.map(l => this.sub(l));
            this.systemLineIndex = 0;
            this.systemLineTimer = 0;
            this.pendingNextForSystem = node.next;
            // System screens = "A problem has been detected"-style BSOD. Start typing SFX.
            MUSIC.startTyping();
            return;
        }

        // dialogue or choice node
        this.phase = "typing";
        MUSIC.startDialogueTyping();

        // npc remembers something player said
        let txt = node.text;
        if (node.memoryText) {
            for (const mem in node.memoryText) {
                if (GameState.hasMemory(mem)) {
                    txt = node.memoryText[mem];
                    break;
                }
            }
        }
        this.fullText = this.sub(txt);
        this.displayText = "";
        this.charIndex = 0;
        this.typingTimer = 0;
        this.currentSpeaker = node.speaker || "";
        this.currentPortrait = node.portrait || "";
        this.currentChoices = node.choices || null;
        this.nextNodeId = node.next || null;

        // first time tutorial's portrait appears, mark him as met so he shows up in the I-menu
        if (this.currentPortrait === "tutorial" && !GameState.metCharacters.tutorial) {
            GameState.metCharacters.tutorial = true;
        }

        // load the bachelor sprite for this expression. tutorial doesnt get a body sprite (yet), hes only ever shown
        // in the speaker label and portrait box
        const folder = SPEAKER_FOLDER[this.currentSpeaker];
        if (folder) {
            let guyExpr = node.expression;
            if (!guyExpr) guyExpr = "Neutral";
            this.currentGuySprite = ASSET_MANAGER.getAsset(`./assets/characters/${folder}/${guyExpr}.png`);
            if (!this.currentGuySprite) {
                this.currentGuySprite = ASSET_MANAGER.getAsset(`./assets/characters/${folder}/Neutral.png`);
            }
        } else {
            this.currentGuySprite = null;
        }

        // player sprite expression
        let girlExpr = node.playerExpr;
        if (!girlExpr) girlExpr = "Natu";
        this.currentGirlSprite = ASSET_MANAGER.getAsset(`./assets/characters/girl1/${girlExpr}.png`);
        if (!this.currentGirlSprite) {
            this.currentGirlSprite = ASSET_MANAGER.getAsset("./assets/characters/girl1/Natu.png");
        }

        if (node.bug === "duc_reboot") {
            this.ducShakeTimer = this.ducShakeDuration;
        }

        // start the entrance animation. if the previous speaker was the same person, theyre already on screen so we
        // skip the slide and go straight to speaking
        if (this.charPhase === CHAR_PHASE_OFF) {
            this.charPhase = CHAR_PHASE_ENTERING;
            this.charLerpT = 0;
            this.charCurrentX = CHAR_OFFSCREEN_X;
            // typing is held back until the slide finishes. flip phase to "waiting" so update knows
            this.phase = "char_entering";
        }
        // if charPhase is already SPEAKING we keep going. same character continuing their turn
    }

    handleDebrief() {
        const who = GameState.visitedToday;
        let num = 1;
        if (who) num = GameState.visitCounts[who];
        if (num > 3) num = 3;
        let reactNode = "dayEnd";
        if (who) reactNode = "tutorialReact" + who + num;
        if (this.data.nodes[reactNode]) {
            this.loadNode(reactNode);
        } else {
            this.loadNode("dayEnd");
        }
    }

    handleDayEnd() {
        MUSIC.stopTyping();
        const ending = GameState.checkEnding();
        if (ending) {
            this.fadeTo(() => {
                this.game.addEntity(new EndingScene(this.game, ending));
                document.removeEventListener("keydown", this.keyHandler);
                this.removeFromWorld = true;
            });
            return;
        }
        GameState.advanceDay();
        this.fadeTo(() => {
            this.game.addEntity(new BootDayScene(this.game, "tutorial_morning"));
            document.removeEventListener("keydown", this.keyHandler);
            this.removeFromWorld = true;
        });
    }

    fadeTo(callback) {
        this.fadingOut = true;
        this.fadeOutTarget = callback;
    }

    playVFX(name, x, y, scale) {
        const def = this.VFX_DEFS[name];
        if (!def) return;
        let fxX = x;
        let fxY = y;
        let fxS = scale;
        if (fxX === undefined) fxX = 960;
        if (fxY === undefined) fxY = 400;
        if (fxS === undefined) fxS = 1;
        this.activeVFX.push({def, x: fxX, y: fxY, scale: fxS, frame: 0, timer: 0, done: false});
    }

    gearHit(p) {
        const g = this.gearBtn;
        if (!p) return false;
        return p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h;
    }

    // ease-out cubic. starts fast, settles slow into the target. feels nicer than linear lerp for character entrances
    // cause it gives the sprite weight when it stops
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    update() {
        // overlay detection. if a settings or character sheet overlay was added, freeze our update
        if (this.paused) {
            let hasOverlay = false;
            for (const e of this.game.entities) {
                if ((e instanceof CharacterSheetScene || e instanceof SettingsScene) && !e.removeFromWorld) {
                    hasOverlay = true;
                    break;
                }
            }
            if (!hasOverlay) this.paused = false;
            else return;
        }

        const dt = this.game.clockTick;
        const click = this.game.click;
        const mouse = this.game.mouse;

        // tick vfx animations
        for (let v = this.activeVFX.length - 1; v >= 0; v--) {
            const fx = this.activeVFX[v];
            fx.timer += dt;
            if (fx.timer >= 1 / fx.def.fps) {
                fx.timer -= 1 / fx.def.fps;
                fx.frame++;
                if (fx.frame >= fx.def.total) {
                    this.activeVFX.splice(v, 1);
                }
            }
        }

        // tutorial blink animation. ticks whenever tutorial's portrait is on screen (including ??? speaker nodes)
        if (this.currentPortrait === "tutorial") {
            this.updateTutorialBlink(dt);
        }

        if (this.fadingIn) {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 1.6);
            if (this.fadeAlpha <= 0) this.fadingIn = false;
        }

        if (this.fadingOut) {
            this.fadeOutAlpha = Math.min(1, this.fadeOutAlpha + dt * 1.8);
            if (this.fadeOutAlpha >= 1 && this.fadeOutTarget) {
                const cb = this.fadeOutTarget;
                this.fadeOutTarget = null;
                cb();
            }
            return;
        }

        if (this.ducShakeTimer > 0) this.ducShakeTimer -= dt;

        if (this.charOpacity < 1) this.charOpacity = Math.min(1, this.charOpacity + dt * 0.67);
        if (this.playerOpacity < 1) this.playerOpacity = Math.min(1, this.playerOpacity + dt * 0.67);
        this.breathTimer += dt * 2.5;

        // tick character entrance state machine. this happens regardless of dialogue phase so the sprite slides
        // smoothly even while system screens are loading underneath
        this.tickCharacterTransition(dt);

        // gear button hover and click. always available except on system screens
        this.gearHovered = false;
        if (mouse && this.phase !== "system" && this.phase !== "system_pause") {
            this.gearHovered = this.gearHit(mouse);
        }

        if (click && this.phase !== "system" && this.phase !== "system_pause" && this.gearHit(click)) {
            this.gearPressed = true;
            setTimeout(() => {
                this.gearPressed = false;
            }, 120);
            this.paused = true;
            this.game.addEntity(new SettingsScene(this.game, this));
            this.game.click = null;
            return;
        }

        // system screen progression
        if (this.phase === "system") {
            this.systemLineTimer += dt;
            if (this.systemLineTimer >= 0.45) {
                this.systemLineTimer = 0;
                this.systemLineIndex++;
                if (this.systemLineIndex >= this.systemLines.length) {
                    this.phase = "system_pause";
                    this.pauseTimer = 0;
                    MUSIC.stopTyping();
                }
            }
            if (click) {

                this.systemLineIndex = this.systemLines.length;
                this.phase = "system_pause";
                this.pauseTimer = 0;
                MUSIC.stopTyping();
                this.game.click = null;
            }
            return;
        }

        if (this.phase === "system_pause") {
            this.pauseTimer += dt;
            if (this.pauseTimer >= 1.0 || click) {
                if (click) this.game.click = null;
                this.loadNode(this.pendingNextForSystem);
            }
            return;
        }

        // while character is sliding in or out, dialogue text doesnt type. swallow clicks so you cant accidentally skip
        // past them. clicks on the gear were handled above
        if (this.phase === "char_entering" || this.charPhase === CHAR_PHASE_EXITING) {
            if (click) this.game.click = null;
            return;
        }

        let justFinishedTyping = false;

        if (this.phase === "typing") {
            this.typingTimer += dt;
            while (this.typingTimer >= this.typingSpeed && this.charIndex < this.fullText.length) {
                this.typingTimer -= this.typingSpeed;
                this.charIndex++;
                this.displayText = this.fullText.slice(0, this.charIndex);
            }
            if (this.charIndex >= this.fullText.length) {
                this.phase = "idle";
                MUSIC.stopTyping(); ;
                justFinishedTyping = true;
            }
        }

        // hover detection
        this.hoveredChoice = -1;
        this.nextBtnHovered = false;
        if (mouse) {
            if (this.phase === "choice" && this.currentChoices) {
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this.choiceRect(i);
                    if (mouse.x >= r.x && mouse.x <= r.x + r.w &&
                        mouse.y >= r.y && mouse.y <= r.y + r.h) {
                        this.hoveredChoice = i;
                        break;
                    }
                }
            }
            if (this.phase === "idle") {
                const n = this.NEXT;
                this.nextBtnHovered = (mouse.x >= n.x && mouse.x <= n.x + n.w &&
                    mouse.y >= n.y && mouse.y <= n.y + n.h);
            }
        }

        if (click) {
            const cx = click.x;
            const cy = click.y;
            this.game.click = null;

            // skip the typewriter on any click. clicking once finishes the line, clicking again advances
            if (this.phase === "typing" || justFinishedTyping) {

                this.charIndex = this.fullText.length;
                this.displayText = this.fullText;
                this.phase = "idle";
                MUSIC.stopTyping();
                return;
            }

            if (this.phase === "idle") {
                // muhammed loop bug. needs 3 separate clicks to escape, each one paints a new
                // dialogue box stacked underneath in a different font
                if (this.currentNode && this.currentNode.bug === "muhammed_loop") {
                    this.muhammedLoopPressed++;
                    if (this.muhammedLoopPressed < 3) {

                        this.nextBtnPressed = true;
                        setTimeout(() => {
                            this.nextBtnPressed = false;
                        }, 120);
                        return;
                    }
                }

                // click anywhere to advance. used to require clicking on the box or the next arrow
                // but everyone tried clicking the screen first so we just made the screen the button
                if (this.nextBtnHovered) {
                    this.nextBtnPressed = true;
                    setTimeout(() => {
                        this.nextBtnPressed = false;
                    }, 120);
                }
                if (this.currentChoices) {
                    this.phase = "choice";
                } else if (this.nextNodeId) {
                    this.loadNode(this.nextNodeId);
                } else {
                    this.phase = "end";
                }
                return;
            }

            if (this.phase === "choice" && this.currentChoices) {
                for (let i = 0; i < this.currentChoices.length; i++) {
                    const r = this.choiceRect(i);
                    if (click.x >= r.x && click.x <= r.x + r.w &&
                        click.y >= r.y && click.y <= r.y + r.h) {

                        this.replyBtnPressedIndex = i;
                        const choice = this.currentChoices[i];

                        const gameFlag = choice.oncePerGame;
                        const dayFlag = choice.oncePerDay;
                        let flagBlocks = false;
                        if (gameFlag && GameState.hasFlag(gameFlag, "game")) flagBlocks = true;
                        if (dayFlag && GameState.hasFlag(dayFlag, "day")) flagBlocks = true;

                        if (choice.points && !flagBlocks) {
                            for (const k in choice.points) {
                                GameState.addPoints(k, choice.points[k]);
                            }
                        }
                        if (gameFlag) GameState.setFlag(gameFlag, "game");
                        if (dayFlag) GameState.setFlag(dayFlag, "day");
                        if (choice.visit) {
                            GameState.visitedToday = choice.visit;
                            if (GameState.metCharacters[choice.visit] === false) {
                                GameState.metCharacters[choice.visit] = true;
                            }
                        }
                        if (choice.memory) GameState.addMemory(choice.memory);
                        if (choice.chaos) GameState.addChaos(choice.chaos, choice.text);

                        // reaction VFX based on the size and sign of the point change
                        if (choice.points && !flagBlocks) {
                            let total = 0;
                            for (const k2 in choice.points) total += choice.points[k2];

                            const offsetX = (Math.random() - 0.5) * 200;
                            const offsetY = (Math.random() - 0.5) * 120;

                            if (choice.chaos) {
                                this.playVFX("analysis_error", 960 + offsetX, 380 + offsetY, 3);
                            } else if (total >= 8) {
                                this.playVFX("heart_pulse", 960 + offsetX, 380 + offsetY, 3);
                            } else if (total > 0) {
                                this.playVFX("heart_form", 960 + offsetX, 380 + offsetY, 3);
                            } else if (total < 0) {
                                this.playVFX("distorted_heart", 960 + offsetX, 380 + offsetY, 3);
                            }
                        }

                        setTimeout(() => {
                            this.replyBtnPressedIndex = -1;
                        }, 120);

                        const ending = GameState.checkEnding();
                        if (ending) {
                            this.fadeTo(() => {
                                this.game.addEntity(new EndingScene(this.game, ending));
                                document.removeEventListener("keydown", this.keyHandler);
                                this.removeFromWorld = true;
                            });
                            return;
                        }

                        this.loadNode(choice.next);
                        break;
                    }
                }
            }
        }
    }

    // step the tutorial blink state machine. this runs his 3-frame sheet through open -> half -> closed -> half -> open
    // with random pauses between cycles. variable timing keeps it lifelike
    updateTutorialBlink(dt) {
        this.tutorialBlinkTimer += dt;
        if (this.tutorialBlinkPhase === "open") {
            if (this.tutorialBlinkTimer >= this.tutorialNextBlinkIn) {
                this.tutorialBlinkPhase = "closing";
                this.tutorialBlinkTimer = 0;
                this.tutorialBlinkFrame = 1;
            }
        } else if (this.tutorialBlinkPhase === "closing") {
            // half frame visible for ~60ms before snapping to fully closed
            if (this.tutorialBlinkTimer >= 0.06) {
                this.tutorialBlinkPhase = "closed";
                this.tutorialBlinkTimer = 0;
                this.tutorialBlinkFrame = 2;
            }
        } else if (this.tutorialBlinkPhase === "closed") {
            // hold the closed eye for a hair longer than the half-frame. feels more natural
            if (this.tutorialBlinkTimer >= 0.09) {
                this.tutorialBlinkPhase = "opening";
                this.tutorialBlinkTimer = 0;
                this.tutorialBlinkFrame = 1;
            }
        } else if (this.tutorialBlinkPhase === "opening") {
            if (this.tutorialBlinkTimer >= 0.06) {
                this.tutorialBlinkPhase = "open";
                this.tutorialBlinkTimer = 0;
                this.tutorialBlinkFrame = 0;
                this.tutorialNextBlinkIn = this.rollNextBlinkDelay();
            }
        }
    }

    // sequence the bachelor in and out across the right half of the screen. ENTERING lerps from CHAR_OFFSCREEN_X down
    // to 0 with ease-out. EXITING lerps the other way and when it hits the wall it triggers loading whatever node was
    // queued up while we were exiting.
    tickCharacterTransition(dt) {
        if (this.charPhase === CHAR_PHASE_OFF) return;

        if (this.charPhase === CHAR_PHASE_ENTERING) {
            this.charLerpT += dt / this.charLerpDuration;
            if (this.charLerpT >= 1) {
                this.charLerpT = 1;
                this.charCurrentX = 0;
                this.charPhase = CHAR_PHASE_SPEAKING;
                // unblock the dialogue. flip from "char_entering" hold-state into the real typing phase
                if (this.phase === "char_entering") this.phase = "typing";
            } else {
                const eased = this.easeOut(this.charLerpT);
                this.charCurrentX = CHAR_OFFSCREEN_X * (1 - eased);
            }
        } else if (this.charPhase === CHAR_PHASE_EXITING) {
            this.charLerpT += dt / this.charLerpDuration;
            if (this.charLerpT >= 1) {
                this.charLerpT = 1;
                this.charCurrentX = CHAR_OFFSCREEN_X;
                this.charPhase = CHAR_PHASE_OFF;
                // exit completed. clear sprite and portrait, then fire whatever node was waiting
                this.currentSpeaker = "";
                this.currentPortrait = "";
                this.currentGuySprite = null;
                if (this.pendingNodeId) {
                    const next = this.pendingNodeId;
                    this.pendingNodeId = null;
                    this.loadNode(next);
                }
            } else {
                const eased = this.easeOut(this.charLerpT);
                this.charCurrentX = CHAR_OFFSCREEN_X * eased;
            }
        }
    }

    choiceRect(i) {
        let n = 4;
        if (this.currentChoices) n = this.currentChoices.length;
        const x = 1920 / 2 - this.REPLY_W / 2;
        const totalH = n * this.REPLY_H + (n - 1) * this.REPLY_GAP;
        const startY = 1080 / 2 - totalH / 2 + 70;
        const y = startY + i * (this.REPLY_H + this.REPLY_GAP);
        return {x, y, w: this.REPLY_W, h: this.REPLY_H};
    }

    draw(ctx) {
        const AM = ASSET_MANAGER;
        const W = 1920, H = 1080;

        const bg = AM.getAsset("./assets/DatingGameUI/Background.jpg");
        if (bg) ctx.drawImage(bg, 0, 0, W, H);

        if (this.phase === "system" || this.phase === "system_pause") {
            this.drawSystem(ctx, W, H);
        } else if (this.phase === "end") {
            // nothing to draw. the next scene takes over
        } else {
            this.drawCharacterAndDialogue(ctx, AM);
        }

        // vfx layer above sprites
        for (const fx of this.activeVFX) {
            const img = ASSET_MANAGER.getAsset(fx.def.asset);
            if (!img) continue;
            const fw = img.width / fx.def.cols;
            const fh = img.height / fx.def.rows;
            const sx = (fx.frame % fx.def.cols) * fw;
            const sy = Math.floor(fx.frame / fx.def.cols) * fh;
            const dw = fw * fx.scale;
            const dh = fh * fx.scale;
            ctx.drawImage(img, sx, sy, fw, fh, fx.x - dw / 2, fx.y - dh / 2, dw, dh);
        }

        if (this.phase !== "system" && this.phase !== "system_pause") {
            this.drawHUD(ctx);
            this.drawGearButton(ctx);
        }

        if (this.fadingIn && this.fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (this.fadingOut) {
            ctx.fillStyle = `rgba(0,0,0,${this.fadeOutAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    drawSystem(ctx, W, H) {
        ctx.fillStyle = "#0000A8";
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#FFFFFF";

        const lh = 46;
        const x = 90;
        const startY = 180;

        let lastDrawnIndex = this.systemLineIndex;
        if (lastDrawnIndex > this.systemLines.length - 1) lastDrawnIndex = this.systemLines.length - 1;

        for (let i = 0; i <= lastDrawnIndex; i++) {
            const line = this.systemLines[i];
            if (line === "") continue;
            const isHeader = line.startsWith("***") || line.startsWith("END OF DAY") ||
                line.startsWith("UNEXPECTED") || line.startsWith("USER_") || line.startsWith("DAY_");
            if (isHeader) {
                ctx.font = "bold 36px 'Lucida Console', 'Consolas', monospace";
            } else {
                ctx.font = "32px 'Lucida Console', 'Consolas', monospace";
            }
            ctx.fillText(line, x, startY + i * lh);
        }
    }

    drawCharacterAndDialogue(ctx, AM) {
        let shakeX = 0, shakeY = 0;
        if (this.ducShakeTimer > 0) {
            const intensity = (this.ducShakeTimer / this.ducShakeDuration) * 14;
            shakeX = (Math.random() - 0.5) * intensity * 2;
            shakeY = (Math.random() - 0.5) * intensity * 2;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        const isChoice = this.phase === "choice";

        // sprites first, then dialogue UI on top
        this.drawCharSprite(ctx, isChoice);

        if (isChoice) {
            // choice phase: hide the dialogue box, swap container/label to show the player as the one whos about to
            // speak, then render reply buttons over the top
            this.drawPlayerPortraitContainer(ctx, AM);
            this.drawPlayerSpeakerLabel(ctx);
            if (this.currentChoices) this.drawReplyButtons(ctx, AM);
        } else {
            this.drawDialogueBox(ctx, AM);
            this.drawCharacterContainer(ctx, AM);
            this.drawSpeakerLabel(ctx);

            if (isChoice && this.currentChoices) {
                this.drawReplyButtons(ctx, AM);
            }
        }

        ctx.restore();

        if (this.ducShakeTimer > 0) {
            ctx.fillStyle = `rgba(255, 30, 30, ${(this.ducShakeTimer / this.ducShakeDuration) * 0.22})`;
            ctx.fillRect(0, 0, 1920, 1080);
        }
    }

    drawCharSprite(ctx, isChoice) {
        const guyImg = this.currentGuySprite;
        let girlImg = this.currentGirlSprite;
        if (!girlImg) girlImg = ASSET_MANAGER.getAsset("./assets/characters/girl1/Natu.png");

        const W = 1920, H = 1080;
        const breathY = Math.sin(this.breathTimer) * 4;
        const breathY2 = Math.sin(this.breathTimer * 0.85 + 1) * 3;

        // during choice phase bachelor isnt talking. push them off-center and let the player take focus
        let guyTalking = false;
        if (this.currentSpeaker && !isChoice) guyTalking = true;

        const girlScale = 0.85;
        let girlX = -W * 0.28;
        if (isChoice) girlX = -W * 0.18;
        const girlY = H * (1 - girlScale);

        let guyBaseX = W * 0.28;
        if (guyTalking) guyBaseX = W * 0.18;
        // add the slide in offset on top. charCurrentX is 0 when arrived, positive when off-screen right
        const guyX = guyBaseX + this.charCurrentX;

        const guyScale = 1.45;

        const drawGirl = () => {
            if (!girlImg) return;
            ctx.save();
            ctx.globalAlpha = this.playerOpacity;
            ctx.drawImage(girlImg, girlX, girlY + breathY, W * girlScale, H * girlScale);
            ctx.restore();
        };
        const drawGuy = () => {
            if (!guyImg) return;
            ctx.save();
            ctx.globalAlpha = this.charOpacity;
            const gW = W * guyScale;
            const gH = H * guyScale;
            const scaleOffX = (gW - W) / 2;
            ctx.drawImage(guyImg, guyX - scaleOffX, breathY2, gW, gH);
            ctx.restore();
        };

        // z-order: whoever is talking gets drawn on top
        if (guyTalking) {
            drawGirl();
            drawGuy();
        } else {
            drawGuy();
            drawGirl();
        }
    }

    drawCharacterContainer(ctx, AM) {
        const c = this.CHAR_BOX;
        const containerImg = AM.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");
        if (containerImg) ctx.drawImage(containerImg, c.x, c.y, c.w, c.h);

        // tutorial face uses the blink sprite sheet, everyone else uses a single Face.png.
        // check portrait key (not speaker label) so the face renders even on nodes where speaker is "???"
        if (this.currentPortrait === "tutorial") {
            const sheet = ASSET_MANAGER.getAsset("./assets/characters/tutorial/face.png");
            if (sheet) {
                // tutorial's sheet is wider relative to the container so we scale it down a bit
                // so the face doesnt bleed past the container edges
                const ip = 30;
                const frameW = sheet.width / 3;
                const frameH = sheet.height;
                const sx = this.tutorialBlinkFrame * frameW;
                ctx.drawImage(
                    sheet,
                    sx, 0, frameW, frameH,
                    c.x + ip + FACE_X_OFFSET + 9, c.y + ip + FACE_Y_OFFSET + 30,
                    c.w - ip * 2.5, c.h - ip * 2.5
                );
            }
            return;
        }

        const facePath = SPEAKER_FACE[this.currentSpeaker];
        if (!facePath) return;
        const faceImg = ASSET_MANAGER.getAsset(facePath);
        if (faceImg) {
            const ip = 18;
            ctx.drawImage(
                faceImg,
                c.x + ip + FACE_X_OFFSET,
                c.y + ip + FACE_Y_OFFSET,
                c.w - ip * 2,
                c.h - ip * 2
            );
        }
    }

    // choice phase variant: paint the players face into the same container box. uses the girl1 Face.png since thats the
    // one designed for portrait crops
    drawPlayerPortraitContainer(ctx, AM) {
        const c = this.CHAR_BOX;
        const containerImg = AM.getAsset("./assets/DatingGameUI/CharacterScreen/CharacterContainer.png");
        if (containerImg) ctx.drawImage(containerImg, c.x, c.y, c.w, c.h);
        const faceImg = AM.getAsset("./assets/characters/girl1/Face.png");
        if (faceImg) {
            const ip = 18;
            ctx.drawImage(
                faceImg,
                c.x + ip + FACE_X_OFFSET + 10,
                c.y + ip + PLAYER_FACE_Y_OFFSET + 40,
                c.w - ip * 4,
                c.h - ip * 4
            );
        }
    }

    drawSpeakerLabel(ctx) {
        if (!this.currentSpeaker) return;
        const s = this.SPEAKER;

        let speakerColor = "#e8006f";
        const colorMap = {
            "ĐỨC": "#3a5a9a",
            "MUHAMMED": "#d87a1f",
            "MIKHAIL": "#a02030",
            "TUTORIAL": "#2a9090",
            "SYSTEM": "#ff2200",
            "???": "#666666",
        };
        if (colorMap[this.currentSpeaker]) speakerColor = colorMap[this.currentSpeaker];

        const labelBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        if (labelBg) ctx.drawImage(labelBg, s.x, s.y, s.w, s.h);

        // tutorial occasionally glitches a character of his name. very low chance per frame
        let nameDisplay = this.currentSpeaker;
        if (this.currentSpeaker === "TUTORIAL" && Math.random() < 0.018) {
            const glyphs = "!@#$%^&*<>?/|{}~`";
            const idx = Math.floor(Math.random() * nameDisplay.length);
            nameDisplay = nameDisplay.slice(0, idx) +
                glyphs[Math.floor(Math.random() * glyphs.length)] +
                nameDisplay.slice(idx + 1);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 40px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = speakerColor;
        ctx.fillText(nameDisplay, s.x + s.w / 2, s.y + s.h / 2);
    }

    // choice phase label. shows the player name in pink so it visually contrasts with the bachelors color. lets the
    // player know that THEY are about to speak
    drawPlayerSpeakerLabel(ctx) {
        const s = this.SPEAKER;
        const labelBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        if (labelBg) ctx.drawImage(labelBg, s.x, s.y, s.w, s.h);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 40px 'The Bold Font', Georgia, serif";
        ctx.fillStyle = "#e8006f";
        ctx.fillText(GameState.playerName, s.x + s.w / 2, s.y + s.h / 2);
    }

    drawDialogueBox(ctx, AM) {
        const d = this.DLG;
        const dlgImg = AM.getAsset("./assets/DatingGameUI/Dialogue/DialogueContainer.png");
        if (dlgImg) ctx.drawImage(dlgImg, d.x, d.y, d.w, d.h);

        const renderText = this.displayText;

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#1a1a4e";

        // TODO: Fix Dialogue box still not working properly
        // muhammed loop bug. each click stacks ANOTHER dialogue box below the first one, each in a different font. keeps the text from being squished into one tiny strip
        if (this.currentNode && this.currentNode.bug === "muhammed_loop" && this.phase === "idle") {
            this.drawMuhammedLoopBoxes(ctx, AM, renderText);
            return;
        }

        ctx.font = "bold 32px 'The Bold Font', Georgia, serif";
        this.wrapText(ctx, renderText, d.x + 280, d.y + 40, d.w - 380, 44);

        if (this.phase === "idle") {
            const hasNext = this.nextNodeId || this.currentChoices;
            if (hasNext) {
                const n = this.NEXT;
                let key = "./assets/DatingGameUI/NextBtn.png";
                if (this.nextBtnHovered || this.nextBtnPressed) {
                    key = "./assets/DatingGameUI/NextBtnPressed.png";
                }
                const img = AM.getAsset(key);
                if (img) ctx.drawImage(img, n.x, n.y, n.w, n.h);
            }
        }
    }

    // TODO: This was temporarily put in fix me
    // muhammed loop renderer. up to 3 stacked mini-boxes, each in its own font, each fading to gray once theyve been
    // clicked past. forms a visual stack of his self-repeating dialogue
    drawMuhammedLoopBoxes(ctx, AM, renderText) {
        const d = this.DLG;
        const dlgImg = AM.getAsset("./assets/DatingGameUI/Dialogue/DialogueContainer.png");

        // each repeat gets its own slim box stacked in the same dialogue area. height is split so all 3 fit even on the original DLG height
        const repeats = 3;
        const boxGap = 6;
        const boxH = (d.h - boxGap * (repeats - 1)) / repeats;
        const fonts = [
            "bold 22px 'The Bold Font', Georgia, serif",
            "italic 22px 'Roboto', sans-serif",
            "bold 22px 'Lucida Console', monospace",
        ];

        for (let i = 0; i < repeats; i++) {
            const by = d.y + i * (boxH + boxGap);
            // draw a separate dialogue container per loop so it really feels like 3 boxes not one with three text columns
            if (dlgImg) {
                ctx.save();
                if (i < this.muhammedLoopPressed) ctx.globalAlpha = 0.35;
                ctx.drawImage(dlgImg, d.x, by, d.w, boxH);
                ctx.restore();
            }
            ctx.save();
            if (i < this.muhammedLoopPressed) ctx.globalAlpha = 0.4;
            ctx.font = fonts[i];
            ctx.fillStyle = "#1a1a4e";
            // line height drops slightly for the smaller boxes
            this.wrapText(ctx, renderText, d.x + 280, by + 18, d.w - 380, 26);
            ctx.restore();
        }

        ctx.font = "italic 18px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(100, 100, 140, 0.85)";
        ctx.textAlign = "left";
        ctx.fillText(
            `(loop ${this.muhammedLoopPressed + 1} / 3, click anywhere to skip)`,
            d.x + 280,
            d.y + d.h - 26
        );

        // next arrow on the very last loop click
        if (this.muhammedLoopPressed >= 0) {
            const n = this.NEXT;
            let key = "./assets/DatingGameUI/NextBtn.png";
            if (this.nextBtnHovered || this.nextBtnPressed) {
                key = "./assets/DatingGameUI/NextBtnPressed.png";
            }
            const img = AM.getAsset(key);
            if (img) ctx.drawImage(img, n.x, n.y, n.w, n.h);
        }
    }

    drawReplyButtons(ctx, AM) {
        const rKey = "./assets/DatingGameUI/Dialogue/ReplyBtn.png";
        const rpKey = "./assets/DatingGameUI/Dialogue/ReplyBtnPressed.png";

        for (let i = 0; i < this.currentChoices.length; i++) {
            const r = this.choiceRect(i);
            const isHov = i === this.hoveredChoice;
            const isPressed = i === this.replyBtnPressedIndex;

            if (isHov && !isPressed) {
                ctx.save();
                ctx.shadowColor = "#ff4fa0";
                ctx.shadowBlur = 28;
            }

            let key = rKey;
            if (isPressed) key = rpKey;
            const img = AM.getAsset(key);
            if (img) ctx.drawImage(img, r.x, r.y, r.w, r.h);

            if (isHov && !isPressed) ctx.restore();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 28px 'The Bold Font', serif";
            ctx.fillStyle = "#3a1a4e";
            const label = this.currentChoices[i].text;
            this.wrapTextCentered(ctx, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 60, 34);
        }
    }

    drawHUD(ctx) {
        const hudBg = ASSET_MANAGER.getAsset("./assets/DatingGameUI/CharacterScreen/SmallTextContainer.png");
        if (hudBg) ctx.drawImage(hudBg, 1920 - 340, 28, 312, 64);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 24px 'The Bold Font', serif";
        ctx.fillStyle = "#4a2a58";
        ctx.fillText(`DAY ${GameState.currentDay}  ·  Press I`, 1920 - 340 + 156, 60);
    }

    drawGearButton(ctx) {
        const g = this.gearBtn;
        let greenAsset = "./assets/DatingGameUI/GreenBtn.png";
        if (this.gearHovered) greenAsset = "./assets/DatingGameUI/GreenBtnPressed.png";
        const greenBtn = ASSET_MANAGER.getAsset(greenAsset);
        const gearIcon = ASSET_MANAGER.getAsset("./assets/DatingGameUI/Icons/Settings.png");

        if (greenBtn) ctx.drawImage(greenBtn, g.x, g.y, g.w, g.h);
        if (gearIcon) {
            const cx = g.x + g.w / 2;
            const cy = g.y + g.h / 2;
            const baseSize = Math.max(gearIcon.width || 56, gearIcon.height || 56);
            const scale = 56 / baseSize;
            const w = (gearIcon.width || 56) * scale;
            const h = (gearIcon.height || 56) * scale;
            ctx.drawImage(gearIcon, cx - w / 2, cy - h / 2, w, h);
        }
    }


    wrapText(ctx, text, x, y, maxW, lineH) {
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

    wrapTextCentered(ctx, text, cx, cy, maxW, lineH) {
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
}