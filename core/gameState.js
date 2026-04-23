// global game state -- tracks relationship points, day count, who the player has met
// 10 pts = 1 heart. 35 pts with a bachelor = DEFEAT, 18 pts with Tutorial = VICTORY

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
    // has player met / unlocked a character's card? (for 'I' screen)
    metCharacters: {
        duc: false,
        muhammed: false,
        mikhail: false,
        tutorial: false,
    },
    // how many times has the player visited each character? (1 based for dialogue flow)
    visitCounts: {
        duc: 0,
        muhammed: 0,
        mikhail: 0,
    },
    // who did the player visit today? prevents picking the same bachelor twice in one day
    visitedToday: null,

    lockedBachelor: null,
    memories: [],


    // flag sets for one-time rewards
    flagsGame: {},   // persistent for the whole run
    flagsDay: {},    // cleared each day

    // thresholds
    HEART_VALUE: 10,
    MAX_HEARTS: 5,
    BACHELOR_MAX_POINTS: 35,   // 3.5 hearts = defeat
    TUTORIAL_WIN_POINTS: 18,   // gotta work for it across all 3 days
    CHAOS_THRESHOLD: 15,       // high chaos unlocks TRANSCEND ending

    // Helpers
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

    isHighChaos() {
        return this.chaosPoints >= this.CHAOS_THRESHOLD;
    },

    addMemory(tag) {
        if (!this.memories.includes(tag)) this.memories.push(tag);
    },

    hasMemory(tag) {
        return this.memories.includes(tag);
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
            if (this.isHighChaos()) return "TRANSCEND";
            return "VICTORY";
        }
        for (const name of ["duc", "muhammed", "mikhail"]) {
            if (this.relationshipPoints[name] >= this.BACHELOR_MAX_POINTS) {
                this.lockedBachelor = name;
                return "DEFEAT";
            }
        }
        return null;
    },

    advanceDay() {
        this.currentDay++;
        this.visitedToday = null;
        this.visitedTodayList = [];
        this.flagsDay = {};
    },

    reset() {
        this.playerName = "UNKNOWN";
        this.currentDay = 1;
        this.relationshipPoints = { duc: 0, muhammed: 0, mikhail: 0, tutorial: 0 };
        this.chaosPoints = 0;
        this.glitchLog = [];
        this.visitedTodayList = [];
        this.metCharacters = { duc: false, muhammed: false, mikhail: false, tutorial: false };
        this.visitCounts = { duc: 0, muhammed: 0, mikhail: 0 };
        this.visitedToday = null;
        this.lockedBachelor = null;
        this.memories = [];
        this.flagsGame = {};
        this.flagsDay = {};
    },
};