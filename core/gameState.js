const GameState = {
    playerName: "UNKNOWN",
    currentDay: 1,
    relationshipPoints: {
        duc: 0,
        muhammed: 0,
        mikhail: 0,
        tutorial: 0,
    },
    chaosPoints: 0,

    glitchLog: [],

    metCharacters: {
        duc: false,
        muhammed: false,
        mikhail: false,
        tutorial: false,
    },
    visitCounts: {
        duc: 0,
        muhammed: 0,
        mikhail: 0,
    },
    visitedToday: null,
    lockedBachelor: null,

    flagsGame: {},
    flagsDay: {},

    HEART_VALUE: 10,
    MAX_HEARTS: 5,
    BACHELOR_MAX_POINTS: 50,
    TUTORIAL_WIN_POINTS: 10,
    CHAOS_THRESHOLD: 15,

    addPoints(character, amount) {
        if (!(character in this.relationshipPoints)) return;
        this.relationshipPoints[character] = Math.max(
            0, this.relationshipPoints[character] + amount
        );
    },

    addChaos(amount, reason) {
        this.chaosPoints += amount;
        if (reason) {
            this.glitchLog.push({
                day: this.currentDay,
                event: reason,
                chaos: amount,
            });
        }
    },

    hasFlag(flag, scope) {
        if (scope === "day") return !!this.flagsDay[flag];
        return !!this.flagsGame[flag];
    },

    setFlag(flag, scope) {
        if (scope === "day") this.flagsDay[flag] = true;
        else this.flagsGame[flag] = true;
    },

    getHearts(character) {
        if (character === "tutorial") return 0;
        const pts = this.relationshipPoints[character] || 0;
        return Math.min(this.MAX_HEARTS, Math.floor(pts / this.HEART_VALUE));
    },

    isHighChaos() {
        return this.chaosPoints >= this.CHAOS_THRESHOLD;
    },

    checkEnding() {
        if (this.relationshipPoints.tutorial >= this.TUTORIAL_WIN_POINTS) {
            if (this.isHighChaos()) return "TRANSCEND";
            return "VICTORY";
        }
        for (const name of ["duc", "muhammed", "mikhail"]) {
            if (this.relationshipPoints[name] >= this.BACHELOR_MAX_POINTS) {
                return "DEFEAT";
            }
        }
        return null;
    },

    advanceDay() {
        this.currentDay++;
        this.visitedToday = null;
        this.flagsDay = {};
    },

    reset() {
        this.playerName = "UNKNOWN";
        this.currentDay = 1;
        this.relationshipPoints = { duc: 0, muhammed: 0, mikhail: 0, tutorial: 0 };
        this.chaosPoints = 0;
        this.glitchLog = [];
        this.metCharacters = { duc: false, muhammed: false, mikhail: false, tutorial: false };
        this.visitCounts = { duc: 0, muhammed: 0, mikhail: 0 };
        this.visitedToday = null;
        this.lockedBachelor = null;
        this.flagsGame = {};
        this.flagsDay = {};
    },
};
