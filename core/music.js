class Music {
    constructor() {
        // Background music
        try {
            this.track = new Audio("./assets/audio/background.mp3");
            this.track.preload = "auto";
            this.track.volume = 0.6;
            this.track.loop = true;
        } catch (e) {
            console.log("Music failed to load:", e);
            this.track = null;
        }

        // Click sound effect
        try {
            this.click = new Audio("./assets/audio/click.mp3");
            this.click.preload = "auto";
            this.click.volume = 0.4;
        } catch (e) {
            console.log("Click SFX failed to load:", e);
            this.click = null;
        }

        this.isPausedByUser = false;
        this.unlocked = false;
    }

    playClick() {
        if (!this.click) return;
        this.click.currentTime = 0; // reset so it can replay immediately
        this.click.play().catch(e => console.log("Click blocked:", e));
    }

    unlock() {
        if (!this.track || this.unlocked) return;
        this.unlocked = true;
        if (!this.isPausedByUser) {
            this.track.play().catch(e => console.log("Blocked:", e));
        }
    }

    toggle() {
        if (!this.track) return;
        this.isPausedByUser = !this.isPausedByUser;
        if (this.isPausedByUser) {
            this.track.pause();
        } else {
            this.track.play().catch(e => console.log("Resume blocked:", e));
        }
        return this.isPausedByUser;
    }

    stop() {
        if (!this.track) return;
        this.track.pause();
        this.track.currentTime = 0;
    }
}