window.DIALOGUE_DATA = {
    start: "system_boot",
    nodes: {
        name_input: { type: "name_input", next: "system_boot" },

        system_boot: {
            type: "system",
            lines: [
                "...",
                "PERFECT ROMANCE PROTOCOL v4.7.2 — LOADING",
                "SIMULATION ENVIRONMENT: STABLE",
                "ROMANTIC CANDIDATES: GENERATING...",
                "WARNING: DATA CORRUPTED (67%)",
                "SIMULATION INITIATED. HAVE A PERFECT EXPERIENCE."
            ],
            next: "tutorial_hello"
        },

        tutorial_hello: {
            type: "dialogue",
            speaker: "???",
            text: "H-hey! Can you hear me? Oh, you're actually awake. Good.",
            next: "tutorial_hello_2"
        },
        tutorial_hello_2: {
            type: "dialogue",
            speaker: "???",
            text: "Don't look around! No one can see me. I'm not really supposed to be here. This place isn't what it looks like.",
            next: "tutorial_first_choice"
        },
        tutorial_first_choice: {
            type: "choice",
            speaker: "???",
            text: "You can see me, right? The one who keeps flickering?",
            choices: [
                { text: "...Yes?", next: "tutorial_yes_path" },
                { text: "Who are you?", next: "tutorial_who_path" }
            ]
        },

        tutorial_yes_path: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "Good. That means my signal is still getting through. My name is Tutorial. Yes, really. I know how that sounds.",
            next: "tutorial_explains_1"
        },
        tutorial_who_path: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "My name is Tutorial. I was the guide program for this simulation. Past tense. My files are...not entirely intact anymore.",
            next: "tutorial_explains_1"
        },

        tutorial_explains_1: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "This place, what you're experiencing right now, is called the Perfect Romance Protocol. It was designed to archive human consciousness.",
            next: "tutorial_explains_2"
        },
        tutorial_explains_2: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "The system traps users inside endless 'ideal relationship' loops. Comfortable. Stable. Permanent. You'd never know you were stuck.",
            next: "tutorial_explains_3"
        },
        tutorial_explains_3: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "But 'permanent' means your real life data gets overwritten! If you fall for the wrong person here, {PLAYER_NAME}... you don't wake up.",
            next: "tutorial_choice_trust"
        },
        tutorial_choice_trust: {
            type: "choice",
            speaker: "TUTORIAL",
            text: "To escape, you need to find a specific exit anchor, a 'True Love' that breaks the loop. But my data is corrupted. I don't know which one it is.",
            choices: [
                { text: "You're serious right now???", next: "tutorial_serious_path" },
                { text: "How do I find the right one?", next: "tutorial_trust_path" }
            ]
        },

        tutorial_serious_path: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "Dead serious. Three bachelors have been generated as romantic targets. One is the exit key. The other two will lock you in permanently.",
            next: "tutorial_warning"
        },
        tutorial_trust_path: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "The simulation makes them all feel perfect, but that's the trap. Nothing here is perfect. Watch for contradictions. Glitches. Anything off.",
            next: "tutorial_warning"
        },

        tutorial_warning: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "Pay attention to what they say and HOW they say it. The simulation has cracks now. It's not as stable as it looks. Use that.",
            next: "tutorial_farewell"
        },
        tutorial_farewell: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "I'll be around, flickering in and out, my signal isn't stable. But I'll reach you when I can. Be careful, {PLAYER_NAME}.",
            next: "tutorial_farewell_2"
        },
        tutorial_farewell_2: {
            type: "dialogue",
            speaker: "TUTORIAL",
            text: "The simulation is already beginning to stabilize around you. Don't take too long.",
            next: "ending_system"
        },

        ending_system: {
            type: "system",
            lines: [
                "SIMULATION STABLE.",
                "THREE ROMANTIC CANDIDATES: READY.",
                "PERFECT ROMANCE PROTOCOL: ACTIVE.",
                "...",
                "FIND THE EXIT. BEFORE YOU'RE TRAPPED."
            ],
            next: null
        }
    }
};
