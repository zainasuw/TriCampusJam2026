// global game state. tracks relationship points, day count, who the player has met
// points scale: 10 points = 1 heart. 5 hearts (50 pts) with a bachelor = DEFEAT
// 10 points total with Tutorial = VICTORY

const GameState = {
    playerName: "UNKNOWN",
    currentDay: 1,
    relationshipPoints: {
        duc: 0,
        muhammed: 0,
        mikhail: 0,
        tutorial: 0,
    },
    // has player met / unlocked a character's card? (for 'I' screen)
    metCharacters: {
        duc: false,
        muhammed: false,
        mikhail: false,
    },
    // who did the player visit today? prevents picking the same bachelor twice in one day
    visitedToday: null,

    // flag sets for one-time rewards
    flagsGame: {},   // persistent for the whole run
    flagsDay: {},    // cleared each day

    // thresholds
    HEART_VALUE: 10,
    MAX_HEARTS: 5,
    BACHELOR_MAX_POINTS: 50,   // 5 hearts * 10 = defeat
    TUTORIAL_WIN_POINTS: 10,   // escape condition

    // Helpers
    addPoints(character, amount) {
        if (!(character in this.relationshipPoints)) return;
        this.relationshipPoints[character] = Math.max(
            0, this.relationshipPoints[character] + amount
        );
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

    checkEnding() {
        if (this.relationshipPoints.tutorial >= this.TUTORIAL_WIN_POINTS) {
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
        this.metCharacters = { duc: false, muhammed: false, mikhail: false };
        this.visitedToday = null;
        this.flagsGame = {};
        this.flagsDay = {};
    },
};