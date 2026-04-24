// guys you can change any of these, if a sound is too loud/quiet, the sound range is from 0.0 to 1.0 :)
const AUDIO_DEFAULTS = {
    master:      0.20,   // master volume: slider starting position
    music:       0.25,   // music track: this apply menu + game music
    sfx:         0.20,   // click + typing
    dialogueOn:  true,   // dialogue toggle this is reserved for future use currently unused by our dialogue system :)
    musicOn:     false,
};

// another setting i found is the if click SFX still feels sluggish it is probably frontpadding silence in the .mp3 itself
// set this to trim N seconds off the front of the buffer at decode tim values to try is between 0.02 - 0.08
const CLICK_TRIM_SECONDS  = 0.0;
const TYPING_TRIM_SECONDS = 0.0;

class AudioManager {
    constructor() {
        // settings
        this.masterVolume   = AUDIO_DEFAULTS.master;
        this.musicVolume    = AUDIO_DEFAULTS.music;
        this.sfxVolume      = AUDIO_DEFAULTS.sfx;
        this.dialogueOn     = AUDIO_DEFAULTS.dialogueOn;
        this.musicOn        = AUDIO_DEFAULTS.musicOn;

        // internal state
        this.currentTrack   = null;
        this.unlocked       = false;
        this.audioCtx       = null;
        this.clickBuffer    = null;
        this.typingBuffer   = null;
        this.typingLoopNode = null;

        this.loadMusic();
        this.loadSfx();
    }


    loadMusic() {
        // menu music
        try {
            this.menuMusic = new Audio("./assets/audio/bensound-moonlightcoffee.mp3");
            this.menuMusic.preload = "auto";
            this.menuMusic.loop = true;
            this.menuMusic.volume = this.computedMusicVol();
        } catch (e) {
            console.log("Menu music failed to load:", e);
            this.menuMusic = null;
        }

        try {
            this.gameMusic = new Audio("./assets/audio/background.mp3");
            this.gameMusic.preload = "auto";
            this.gameMusic.loop = true;
            this.gameMusic.volume = this.computedMusicVol();
        } catch (e) {
            console.log("Game music failed to load:", e);
            this.gameMusic = null;
        }
        try {
            this.winSound = new Audio("./assets/audio/wingame.mp3");
            this.winSound.preload = "auto";
        } catch (e) { this.winSound = null; }
        
        try {
            this.loseSound = new Audio("./assets/audio/gameover.mp3");
            this.loseSound.preload = "auto";
        } catch (e) { this.loseSound = null; }
    }

    loadSfx() {
        // webkitAudioContext is the old safari/iOS name. intellij complains its unresolved, but we need it for fallback.
        // using bracket lookup so the IDE stops yelling
        try {
            let Ctx = window.AudioContext;
            if (!Ctx) Ctx = window["webkitAudioContext"];
            this.audioCtx = new Ctx();
        } catch (e) {
            console.log("Web Audio unavailable; falling back to <audio> for SFX");
            this.audioCtx = null;
        }

        if (this.audioCtx) {
            this.decodeInto("./assets/audio/click.mp3",  CLICK_TRIM_SECONDS,  b => this.clickBuffer  = b);
            this.decodeInto("./assets/audio/keyboard.mp3", TYPING_TRIM_SECONDS, b => this.typingBuffer = b);
        }

        // fallbackaudio for SFX in case Web Audio fails entirely
        try {
            this.fallbackClick = new Audio("./assets/audio/click.mp3");
            this.fallbackClick.preload = "auto";
        } catch (e) { this.fallbackClick = null; }
        try {
            this.fallbackTyping = new Audio("./assets/audio/keyboard.mp3");
            this.fallbackTyping.preload = "auto";
            this.fallbackTyping.loop = true;
        } catch (e) { this.fallbackTyping = null; }
        try {
            this.fallbackPopup = new Audio("./assets/audio/popup.mp3");
            this.fallbackPopup.preload = "auto";
        } catch (e) { this.fallbackPopup = null; }
    }

    decodeInto(url, trimSeconds, assign) {
        fetch(url)
            .then(r => r.arrayBuffer())
            .then(bytes => this.audioCtx.decodeAudioData(bytes))
            .then(buf => {
                // optional front trim: slice off the first N seconds of silent that often live inside MP3s
                if (trimSeconds > 0 && buf.length > 0) {
                    const sampleRate = buf.sampleRate;
                    const trimSamples = Math.min(
                        Math.floor(trimSeconds * sampleRate),
                        buf.length - 1
                    );
                    const newLen = buf.length - trimSamples;
                    const trimmed = this.audioCtx.createBuffer(
                        buf.numberOfChannels, newLen, sampleRate
                    );
                    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
                        const src = buf.getChannelData(ch);
                        const dst = trimmed.getChannelData(ch);
                        for (let i = 0; i < newLen; i++) dst[i] = src[i + trimSamples];
                    }
                    assign(trimmed);
                } else {
                    assign(buf);
                }
            })
            .catch(e => console.log("SFX decode failed for", url, e));
    }

    //  volume helpers
    computedMusicVol() {
        if (!this.musicOn) return 0;
        return this.masterVolume * this.musicVolume;
    }

    computedSfxVol() {
        return this.masterVolume * this.sfxVolume;
    }

    // called by SettingsScene whenever a slider/toggle changes.
    applyVolumes() {
        if (this.menuMusic) this.menuMusic.volume = this.computedMusicVol();
        if (this.gameMusic) this.gameMusic.volume = this.computedMusicVol();
        // if music was just turned off mid track, pause; if turned on, resume current track.
        if (!this.musicOn) {
            if (this.menuMusic) this.menuMusic.pause();
            if (this.gameMusic) this.gameMusic.pause();
        } else if (this.currentTrack === "menu" && this.menuMusic) {
            this.menuMusic.play().catch(() => {});
        } else if (this.currentTrack === "game" && this.gameMusic) {
            this.gameMusic.play().catch(() => {});
        }

        // if dialogue typing was turned off mid-type, kill it right now so it doesnt keep looping
        if (!this.dialogueOn && this.typingLoopNode) {
            this.stopTyping();
        }
    }

    unlock() {
        if (this.unlocked) return;
        this.unlocked = true;
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch(() => {});
        }
        if (this.currentTrack === "menu") this.playMenuMusic();
        else if (this.currentTrack === "game") this.playGameMusic();
    }

    playMenuMusic() {
        this.currentTrack = "menu";
        if (this.gameMusic) { this.gameMusic.pause(); this.gameMusic.currentTime = 0; }
        if (!this.menuMusic || !this.musicOn) return;
        this.menuMusic.volume = this.computedMusicVol();
        this.menuMusic.play().catch(e => console.log("Menu music blocked:", e));
    }

    playGameMusic() {
        this.currentTrack = "game";
        if (this.menuMusic) { this.menuMusic.pause(); this.menuMusic.currentTime = 0; }
        if (!this.gameMusic || !this.musicOn) return;
        this.gameMusic.volume = this.computedMusicVol();
        this.gameMusic.play().catch(e => console.log("Game music blocked:", e));
    }


    stopAllMusic() {
        this.currentTrack = null;
        if (this.menuMusic) { this.menuMusic.pause(); this.menuMusic.currentTime = 0; }
        if (this.gameMusic) { this.gameMusic.pause(); this.gameMusic.currentTime = 0; }
    }

    playWin() {
        this.stopAllMusic();
        if (this.winSound) {
            this.winSound.volume = this.masterVolume;
            this.winSound.currentTime = 0;
            this.winSound.play().catch(() => {});
        }
    }

    playLose() {
        this.stopAllMusic();
        if (this.loseSound) {
            this.loseSound.volume = this.masterVolume;
            this.loseSound.currentTime = 0;
            this.loseSound.play().catch(() => {});
        }
    }

    playClick() {
        this.playBuffer(this.clickBuffer, this.fallbackClick, false);
    }

    playPopup() {
        this.playBuffer(null, this.fallbackPopup, false);
    }

    // typing sfx for the BSOD / pink screen boot text (fast + loud)
    startTyping() {
        if (this.audioCtx && this.typingBuffer) {
            this.stopTyping(); // don't stack loops
            const src = this.audioCtx.createBufferSource();
            src.buffer = this.typingBuffer;
            src.loop = true;
            // increase playback rate to make typing sound much faster
            src.playbackRate.value = 2.0;

            const g = this.audioCtx.createGain();
            g.gain.value = this.computedSfxVol();
            src.connect(g).connect(this.audioCtx.destination);
            src.start(0);
            this.typingLoopNode = { source: src, gain: g };
        } else if (this.fallbackTyping) {
            this.fallbackTyping.volume = this.computedSfxVol();
            this.fallbackTyping.playbackRate = 2.0;
            this.fallbackTyping.currentTime = 0;
            this.fallbackTyping.play().catch(() => {});
        }
    }

    // typing sfx for the in game dialogue box. gated by dialogueOn toggle in the settings menu. bumped the gain
    // multiplier from 0.4 -> 0.9 because it was way too quiet compared to the fast typing sfx
    startDialogueTyping() {
        if (!this.dialogueOn) return;  // dialogue sfx turned off in settings

        if (this.audioCtx && this.typingBuffer) {
            this.stopTyping();
            const src = this.audioCtx.createBufferSource();
            src.buffer = this.typingBuffer;
            src.loop = true;
            src.playbackRate.value = 1.2;

            const g = this.audioCtx.createGain();
            g.gain.value = this.computedSfxVol() * 0.9;
            src.connect(g).connect(this.audioCtx.destination);
            src.start(0);
            this.typingLoopNode = { source: src, gain: g };
        } else if (this.fallbackTyping) {
            this.fallbackTyping.volume = this.computedSfxVol() * 0.9;
            this.fallbackTyping.playbackRate = 1.2;
            this.fallbackTyping.currentTime = 0;
            this.fallbackTyping.play().catch(() => {});
        }
    }

    stopTyping() {
        if (this.typingLoopNode) {
            try { this.typingLoopNode.source.stop(); } catch (e) {}
            this.typingLoopNode = null;
        }
        if (this.fallbackTyping) {
            this.fallbackTyping.pause();
            this.fallbackTyping.currentTime = 0;
        }
    }

    playBuffer(buffer, fallbackAudio, loop) {
        if (this.audioCtx && buffer) {
            const src = this.audioCtx.createBufferSource();
            src.buffer = buffer;
            src.loop = !!loop;
            const g = this.audioCtx.createGain();
            g.gain.value = this.computedSfxVol();
            src.connect(g).connect(this.audioCtx.destination);
            src.start(0);
            return;
        }
        if (fallbackAudio) {
            try {
                fallbackAudio.volume = this.computedSfxVol();
                fallbackAudio.currentTime = 0;
                fallbackAudio.play().catch(() => {});
            } catch (e) { /* we ignore, do nothing */ }
        }
    }

    toggle() {
        this.musicOn = !this.musicOn;
        this.applyVolumes();
        return this.musicOn;
    }
    stop() { this.stopAllMusic(); }
}

// expose as name existing scenes already import
class Music extends AudioManager {}