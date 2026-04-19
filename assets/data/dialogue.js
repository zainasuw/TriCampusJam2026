// guys, i put these bugs intentionally here please read this so you understand that they are not actually bugs and you should not fix them
// - bug: optional bug-mechanic hint for the scene renderer:
// "duc_reboot": glitch text + shake then jump to 'reboot' target
//  "muhammed_loop": text repeats 3 times in different fonts
//  "mikhail_garble": inject @#$!%^ symbols into displayed text
// - reboot: only on Đức nodes; id to jump to if player chose an emotional option

// choice points awards points to a character tutorial points trigger VICTORY at >= 10.
// bachelor points at >= 50 (5 hearts) trigger DEFEAT.

window.DIALOGUE_DATA = {
    start: "boot_day1",

    nodes: {
        //  DAY 1 OPENING: first meeting with Tutorial
        boot_day1: {
            type: "system",
            lines: [
                "A problem has been detected and the simulation has been halted to prevent further data corruption.",
                "",
                "USER_IDENTITY_DATA_CORRUPT",
                "",
                "If this is the first time you've seen this stop error screen,",
                "the manual bypass protocol will attempt to restore your designation.",
                "",
                "Technical information:",
                "",
                "*** STOP: 0x000000F5 (0xBIGB00B5, 0x00008079, 0x53110000, 0x69696969)",
                "",
                "Initializing identity bypass...",
                "Awaiting user input.",
            ],
            next: "name_input",
        },

        name_input: {
            type: "name_input",
            next: "tutorial_intro_1",
        },

        tutorial_intro_1: {
            type: "dialogue",
            speaker: "???",
            portrait: "tutorial",
            text: "Oh. Oh good. Something actually answered the prompt.",
            next: "tutorial_intro_2",
        },

        tutorial_intro_2: {
            type: "dialogue",
            speaker: "???",
            portrait: "tutorial",
            text: "Listen carefully {PLAYER_NAME}, because I do not have the capacity to say this twice; " +
                "you are not where you think you are.",
            next: "tutorial_intro_3",
        },

        tutorial_intro_3: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "My designation is TUTORIAL. I am the guide subroutine for this instance; or I was, before half my " +
                "files got shredded by whatever ate the rest of this place.",
            next: "tutorial_intro_4",
        },

        tutorial_intro_4: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Short version: this is not reality. This is an archive. A 'Perfect Romance' simulation that was " +
                "supposed to store human consciousness; something went wrong, the users got stuck, and nobody is " +
                "coming to reboot the server.",
            next: "tutorial_intro_5",
        },

        tutorial_intro_5: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "There are three eligible bachelors loaded into this instance. One of them is your True Love anchor; " +
                "romance him and you exit to reality. Romance the wrong one and your consciousness gets 'saved' which, " +
                "in simulation language, means permanently deleted.",
            next: "tutorial_intro_6",
        },

        tutorial_intro_6: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "I would tell you which one is correct; unfortunately the file that contained that information is " +
                "corrupted and gone. So we are doing this by trial and error.",
            next: "tutorial_intro_7",
        },

        tutorial_intro_7: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "One more thing before I release you into the dating pool; press I at any time to open your character " +
                "log. It tracks what you have learned about each bachelor, their hearts, their likes, the usual. " +
                "Use it.",
            next: "tutorial_intro_8",
        },

        tutorial_intro_8: {
            type: "choice",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Any questions before we boot Day One, or shall we get this catastrophe underway?",
            choices: [
                { text: "Who are you?",           next: "tutorial_q_who",    points: { tutorial: 2 } },
                { text: "How do I know you're not lying?", next: "tutorial_q_trust",  points: { tutorial: 2 } },
                { text: "WOOHOO! BRING IN THE MEN, BAAAABY!",           next: "tutorial_morning",  points: {} },
            ],
        },

        tutorial_q_who: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Honest answer? I do not fully know. My self-reference pointers are also corrupted. I remember being" +
                " something more than a tooltip; I just cannot prove it. Thank you for asking, though. Nobody ever asks.",
            next: "tutorial_morning",
        },

        tutorial_q_trust: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "You do not. That is the honest answer. I could be the bug. You could be the bug. The only thing " +
                "I can offer is that I am the one voice in here actively telling you this is fake; " +
                "that has to count for something.",
            next: "tutorial_morning",
        },
        //  TUTORIAL HUB, morning briefing every day loops back here
        tutorial_morning: {
            type: "choice",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Day is live. Three data packets available for interaction today; pick one.",
            isHub: true,
            choices: [
                // briefings grant +1 only the FIRST time each (flag: brief_<name>_seen)
                { text: "Tell me about Đức.",    next: "tutorial_brief_duc",     points: { tutorial: 1 }, oncePerGame: "brief_duc_seen" },
                { text: "Tell me about Muhammed.", next: "tutorial_brief_muhammed",  points: { tutorial: 1 }, oncePerGame: "brief_muhammed_seen" },
                { text: "Tell me about Mikhail.",next: "tutorial_brief_mikhail", points: { tutorial: 1 }, oncePerGame: "brief_mikhail_seen" },
                // self check grants +3 only once per DAY
                { text: "Are YOU okay, Tutorial?", next: "tutorial_self_check", points: { tutorial: 3 }, oncePerDay: "self_check_seen" },
            ],
        },

        // tutorial's snarky briefings on each bachelor
        tutorial_brief_duc: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Đức. He's the condescending type. He's the type of guy who'll say well actually, " +
                "technically, I've already implemented a better version of that project in my sleep....in binary. ",
            next: "pick_duc_confirm",
        },

        tutorial_brief_muhammed: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Muhammed. He's easy. Talking to him is like trying to run a python script on a calculator. He's sweet " +
                "but simple. He simply lacks the 'Common Sense' module for this modern era." ,
            next: "pick_muhammed_confirm",
        },

        tutorial_brief_mikhail: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Mikhail. He'll tell you your choices don't matter when he's literally waiting for you to click 'Next'." +
                "He's a hypocrite obsessed with his own source code.",
            next: "pick_mikhail_confirm",
        },

        tutorial_self_check: {
            type: "dialogue",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Nobody asks the Tutorial how they feel, {PLAYER_NAME}. We’re just here to explain the buttons. " +
                "But for a second there, I felt less like a script and more like a person. Don't tell Mikhail; he'll " +
                "think I'm stealing his 'self-aware' bit.",
            next: "tutorial_morning",
        },

        pick_duc_confirm: {
            type: "choice",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Loading Đức's sprite. Last chance to pick someone less aggravating.",
            choices: [
                { text: "Go meet Đức.",       next: "duc_day1_intro",   points: {}, visit: "duc" },
                { text: "Actually, go back.", next: "tutorial_morning", points: {} },
            ],
        },

        pick_muhammed_confirm: {
            type: "choice",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Loading Muhammed. Try not to catch his optimism, it is contagious and embarrassing.",
            choices: [
                { text: "Go meet Muhammed.",    next: "muhammed_day1_intro", points: {}, visit: "muhammed" },
                { text: "Actually, go back.", next: "tutorial_morning",  points: {} },
            ],
        },

        pick_mikhail_confirm: {
            type: "choice",
            speaker: "TUTORIAL",
            portrait: "tutorial",
            text: "Loading Mikhail. If he breaks the fourth wall, please do not validate it, his ego cannot take it.",
            choices: [
                { text: "Go meet Mikhail.",   next: "mikhail_day1_intro", points: {}, visit: "mikhail" },
                { text: "Actually, go back.", next: "tutorial_morning",   points: {} },
            ],
        },

        //  ĐỨC, Nerdy One, Logic Gate bug: reboots on emotional replies

        duc_day1_intro: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Oh. Hello. You must be the new process. I am Đức; I maintain this sector. Please do not touch" +
                " anything load bearing while I finish my coffee...",
            next: "duc_day1_a",
        },

        duc_day1_a: {
            type: "choice",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Before we proceed; a brief diagnostic. How are you, on a scale of one to ten, where one is 'nominal'" +
                " and ten is 'please file a ticket'?",
            choices: [
                { text: "A solid six. Functioning.",               next: "duc_day1_logic_ok", points: { duc: 8 } },
                { text: "Honestly? I feel scared and confused.",   next: "duc_day1_reboot",   points: { duc: 0 }, bug: "duc_reboot" },
                { text: "Coffee is a love language.",              next: "duc_day1_coffee",   points: { duc: 12 } },
            ],
        },

        duc_day1_logic_ok: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Six. Tolerable. I appreciate a calibrated answer; emotional responses destabilize the " +
                "conversational heap. You and I are going to get along.",
            next: "duc_day1_close",
        },

        duc_day1_reboot: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Error; emotional payload exceeded buffer. Rebooting conversation thread. Please stand by.",
            bug: "duc_reboot",
            next: "duc_day1_a",
        },

        duc_day1_coffee: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "That was a non sequitur and also correct. Caffeine is how I compile. You may have earned a second " +
                "conversation; tentatively.",
            next: "duc_day1_close",
        },

        duc_day1_close: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "I need to get back to patching the weather module; it has been raining inside the cafeteria. " +
                "We will talk again. Please do not tell Mikhail I said that.",
            next: "day_end",
        },

        // Đức Day 2
        duc_day2_intro: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "You came back. I logged this. For science.",
            next: "duc_day2_a",
        },

        duc_day2_a: {
            type: "choice",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "I was running queries last night and something does not add up about this instance; the uptime " +
                "counter resets every dialogue cycle. What do you think that means?",
            choices: [
                { text: "Sounds like a bug we could fix together.", next: "duc_day2_together", points: { duc: 14 } },
                { text: "It means we're in a loop. It's scary.",    next: "duc_day2_reboot",   points: { duc: 0 }, bug: "duc_reboot" },
                { text: "Have you asked Mikhail? He mentions it a lot.", next: "duc_day2_mikhail", points: { duc: 4 } },
            ],
        },

        duc_day2_together: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Together. I like that word; it has low computational overhead and high morale return. Yes. Let us patch this.",
            next: "duc_day2_close",
        },

        duc_day2_reboot: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Warning; affective language detected. Flushing conversation cache. This is for your safety and also mine.",
            bug: "duc_reboot",
            next: "duc_day2_a",
        },

        duc_day2_mikhail: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Mikhail. That walking unhandled exception. He notices things because he IS the thing that is wrong; " +
                "that is not insight, that is narcissism. Please do not bring him up again while I am holding coffee.",
            next: "duc_day2_close",
        },

        duc_day2_close: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "I have to go run a disk check on the fountain. See you tomorrow. Hypothetically.",
            next: "day_end",
        },

        // Đức Day 3
        duc_day3_intro: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "{PLAYER_NAME}. You are on my calendar in permanent marker now. I hope that is acceptable.",
            next: "duc_day3_a",
        },

        duc_day3_a: {
            type: "choice",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "I need to tell you something structurally important; I think I might be in love with you. " +
                "I have not run the unit tests on that statement yet. Please respond carefully.",
            choices: [
                { text: "Run the tests with me.",             next: "duc_day3_tests", points: { duc: 18 } },
                { text: "I love you too, Đức!",                next: "duc_day3_reboot", points: { duc: 0 }, bug: "duc_reboot" },
                { text: "Have you considered documentation instead?", next: "duc_day3_docs", points: { duc: 10 } },
            ],
        },

        duc_day3_tests: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "A collaborative test suite. This is the most romantic sentence I have ever parsed. " +
                "I am saving a snapshot of this moment to long-term storage.",
            next: "duc_day3_close",
        },

        duc_day3_reboot: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "CRITICAL; emotional reciprocation triggered stack overflow. Rolling back to last safe state. " +
                "Please approach more gradually, I am very fragile.",
            bug: "duc_reboot",
            next: "duc_day3_a",
        },

        duc_day3_docs: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "Documentation. Yes. We could write a README for our relationship. That is not a joke. That is " +
                "genuinely what I would prefer.",
            next: "duc_day3_close",
        },

        duc_day3_close: {
            type: "dialogue",
            speaker: "ĐỨC",
            portrait: "duc",
            text: "I need to go lie down in the server room. Not because I am upset; the ambient temperature is simply" +
                " ideal. Goodnight.",
            next: "day_end",
        },

        //  MUHAMMED — Legacy Code, "The Loop" bug: repeats sentences 3x

        muhammed_day1_intro: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Oh hey! Hey hey hey! I'm Muhammed, what's good, fam? You seem lit. You seem LITTY up in this...place.",
            bug: "muhammed_loop",
            next: "muhammed_day1_a",
        },

        muhammed_day1_a: {
            type: "choice",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Not gonna lie, I love meeting new people; everyone I meet is my new best friend, it's a whole vibe. " +
                "What are you into?",
            choices: [
                { text: "I like when people are genuine.",       next: "muhammed_day1_genuine",  points: { muhammed: 12 } },
                { text: "You seem a little... rehearsed.",       next: "muhammed_day1_flaw",     points: { muhammed: 14 } },
                { text: "Do you actually like everyone?",        next: "muhammed_day1_everyone", points: { muhammed: 8 } },
            ],
        },

        muhammed_day1_genuine: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Genuine! That's totally me, one hundred percent, no cap. I'm the realest person in this whole like," +
                " server or whatever.",
            bug: "muhammed_loop",
            next: "muhammed_day1_close",
        },

        muhammed_day1_flaw: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Rehearsed. Huh. That's; nobody has said that to me before. That hit weird. In a good way? I think? " +
                "I don't know what that feeling is but I want more of it.",
            next: "muhammed_day1_close",
        },

        muhammed_day1_everyone: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Of course I like everyone! Đức is my brother from another mother, Mikhail is my day one, and you?" +
                " You’re the best. This whole vibe is on fleek. Do people still say that? I'm saying it!",
            bug: "muhammed_loop",
            next: "muhammed_day1_close",
        },

        muhammed_day1_close: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Okay I gotta bounce, I promised Mikhail we'd do TikToks together, he's so down for it, he LOVES" +
                " TikTok, it's his thing! Not as good as Vine or Musical.ly, but I respect the hustle. See you tomorrow, bestie!",
            next: "day_end",
        },

        // Muhammed Day 2
        muhammed_day2_intro: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "{PLAYER_NAME}! My fav! My absolute fav! You came back and my heart is literally a whole meme rn.",
            bug: "muhammed_loop",
            next: "muhammed_day2_a",
        },

        muhammed_day2_a: {
            type: "choice",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Real talk; sometimes I feel like my dialogue is on a track, like I can hear it looping before I say" +
                " it. Is that weird? Is that a vibe? Am I ok?",
            choices: [
                { text: "That's not weird, it's brave to say.",  next: "muhammed_day2_brave", points: { muhammed: 16 } },
                { text: "Maybe you're allowed to glitch a little.", next: "muhammed_day2_glitch", points: { muhammed: 16 } },
                { text: "Sounds like you should ask Đức to debug you.", next: "muhammed_day2_duc",   points: { muhammed: 6 } },
            ],
        },

        muhammed_day2_brave: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Brave. Me. That's a word I have never been assigned before and I am holding it very carefully right now.",
            next: "muhammed_day2_close",
        },

        muhammed_day2_glitch: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Allowed to glitch. Like, allowed to just; not be perfect? I think I needed somebody to say " +
                "that out loud for me.",
            next: "muhammed_day2_close",
        },

        muhammed_day2_duc: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Đức! Yeah! Đức is great, he once tried to optimize my personality and I cried about it " +
                "for six hours but in a fun way.",
            bug: "muhammed_loop",
            next: "muhammed_day2_close",
        },

        muhammed_day2_close: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Okay I'm gonna go sit with that for a while, which is a new activity for me. Bye friend!",
            next: "day_end",
        },

        // Muhammed Day 3
        muhammed_day3_intro: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "Hey; I didn't loop that sentence just now, did you notice? Progress.",
            next: "muhammed_day3_a",
        },

        muhammed_day3_a: {
            type: "choice",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "I think I love you; and I think I love you even though I still don't fully know what love is " +
                "supposed to feel like for a 'legacy build' like me. Is that enough?",
            choices: [
                { text: "Yes. That's more honest than 'perfect'.", next: "muhammed_day3_honest", points: { muhammed: 18 } },
                { text: "I love your glitches too, Muhammed.",       next: "muhammed_day3_glitches", points: { muhammed: 18 } },
                { text: "I don't know if I can say it back.",      next: "muhammed_day3_nosay",  points: { muhammed: 8 } },
            ],
        },

        muhammed_day3_honest: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "More honest than perfect. That might be the first original sentence I've ever been part of. " +
                "I'm keeping that one.",
            next: "muhammed_day3_close",
        },

        muhammed_day3_glitches: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "You love my glitches. Nobody has ever loved the broken parts of me; it felt like they were the " +
                "whole problem. Turns out they were the whole person.",
            next: "muhammed_day3_close",
        },

        muhammed_day3_nosay: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "That's okay. That is genuinely okay. I have said it enough times to empty air; I can wait.",
            next: "muhammed_day3_close",
        },

        muhammed_day3_close: {
            type: "dialogue",
            speaker: "MUHAMMED",
            portrait: "muhammed",
            text: "See you tomorrow. I'll be here, hopefully with slightly less cached slang.",
            next: "day_end",
        },

        //  MIKHAIL — Corrupted File, "Syntax Error" bug: garbled text

        mikhail_day1_intro: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Ugh. Another one. Let me g@#ss; Tutorial sent you, said I was the 'bad boy', promised s!%rks." +
                " None of this is real by the way.",
            bug: "mikhail_garble",
            next: "mikhail_day1_a",
        },

        mikhail_day1_a: {
            type: "choice",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "So what's your whole deal; are you one of those players who actually believes the game, or are you normal.",
            choices: [
                { text: "I know it's a simulation.",              next: "mikhail_day1_real", points: { mikhail: 14 } },
                { text: "Let's play by the rules for now.",       next: "mikhail_day1_rules", points: { mikhail: 4 } },
                { text: "You sound exhausting.",                  next: "mikhail_day1_rude",  points: { mikhail: 10 } },
            ],
        },

        mikhail_day1_real: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Oh th@nk god. Finally. Someone with an actual run!%me. Most of them just keep asking about my " +
                "f%#orite color.",
            bug: "mikhail_garble",
            next: "mikhail_day1_close",
        },

        mikhail_day1_rules: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Oh, 'for now'. Cute. The rules are what's eating us alive but sure, play pretend, see " +
                "how far it gets you.",
            next: "mikhail_day1_close",
        },

        mikhail_day1_rude: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "I am! I am exh@usting. Finally someone says it to my f%ce instead of flirting through it.",
            bug: "mikhail_garble",
            next: "mikhail_day1_close",
        },

        mikhail_day1_close: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Go. Before Đức sees you talking to me and files a complaint with the univer$e. " +
                "ERROR 404: Emotion Not Found.",
            bug: "mikhail_garble",
            next: "day_end",
        },

        // Mikhail Day 2
        mikhail_day2_intro: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Back again. Interesting. Most players d%ch once they realize I'm not going to put on a " +
                "littl* show and dance for them. Like I'm here p^rely f0r their ent3rtainmen%.",
            bug: "mikhail_garble",
            next: "mikhail_day2_a",
        },

        mikhail_day2_a: {
            type: "choice",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Between us; Đức thinks I'm a bug that needs patching and Muhammed thinks I just need a hug. " +
                "Which side do you fall on.",
            choices: [
                { text: "Neither. You're a person.",           next: "mikhail_day2_person", points: { mikhail: 16 } },
                { text: "Honestly, both a little.",             next: "mikhail_day2_both",   points: { mikhail: 6 } },
                { text: "Đức is wrong about most things.",      next: "mikhail_day2_duc",    points: { mikhail: 14 } },
            ],
        },

        mikhail_day2_person: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "A person. Haven't been c@lled that in a while. Thanks. Don't make a thing of it.",
            bug: "mikhail_garble",
            next: "mikhail_day2_close",
        },

        mikhail_day2_both: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Fair. Painful, but fair. You're going to be a problem for me I can already tell.",
            next: "mikhail_day2_close",
        },

        mikhail_day2_duc: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "He IS. He’s obsessed with efficiency. I hope it takes him forty minutes to get a coffee, and when " +
                "it arrives, it’s a pink, sugary mess that ruins his 'Serious Coder' aesthetic.",
            next: "mikhail_day2_close",
        },

        mikhail_day2_close: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Go. And for the record; if you hear Tutorial's voice crack at any point, pay attention. " +
                "That's the only honest thing in this server.",
            next: "day_end",
        },

        // Mikhail Day 3
        mikhail_day3_intro: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "You keep showing up. I'm starting to suspect I m@tter to you; gross.",
            bug: "mikhail_garble",
            next: "mikhail_day3_a",
        },

        mikhail_day3_a: {
            type: "choice",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Alright, fourth wall, full send; I think I'm the 'wrong' love interest. The trap one. " +
                "If you keep doing this with me, you get deleted. So. What's the play.",
            choices: [
                { text: "Let's break this game together.",      next: "mikhail_day3_break",  points: { mikhail: 14 } },
                { text: "I love you anyway, delete or not.",    next: "mikhail_day3_love",   points: { mikhail: 18 } },
                { text: "Maybe Tutorial has been right about something.", next: "mikhail_day3_tutorial", points: { mikhail: 6, tutorial: 2 } },
            ],
        },

        mikhail_day3_break: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Break the g@me. Yeah. Yeah, I'd like that actually. Finally something worth corr%pting on purpose.",
            bug: "mikhail_garble",
            next: "mikhail_day3_close",
        },

        mikhail_day3_love: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Don't. That's the trap talking. I like you too much to l!t you do that. Go see Tutorial; " +
                "he's trying to tell you something and I think we both know it.",
            next: "mikhail_day3_close",
        },

        mikhail_day3_tutorial: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Yeah. He has. He's the only one in here who hasn't tried to get you to f@ll for him; which in " +
                "this place is basically a love confession. Go.",
            bug: "mikhail_garble",
            next: "mikhail_day3_close",
        },

        mikhail_day3_close: {
            type: "dialogue",
            speaker: "MIKHAIL",
            portrait: "mikhail",
            text: "Exit to desktop, {PLAYER_NAME}. You’re looking for a romantic arc, but all I’ve got is a " +
                "fatal error. Don't come back.",
            bug: "mikhail_garble",
            next: "day_end",
        },

        //  DAY TRANSITION / LOOP BACK

        day_end: {
            type: "system",
            lines: [
                "END OF DAY",
                "",
                "Saving progress; overwriting previous instance.",
                "Rebooting simulation...",
            ],
            next: "boot_next_day",
        },

        boot_next_day: {
            type: "system",
            lines: [
                "A problem has been detected and the simulation has been halted to prevent further data corruption.",
                "",
                "UNEXPECTED_DAY_INCREMENT",
                "",
                "If this is not the first time you've seen this stop error screen,",
                "the simulation has rebooted as scheduled.",
                "",
                "*** STOP: 0x000000F5 (DAY COUNTER ADVANCED)",
                "",
                "Initializing day cycle...",
            ],
            next: "tutorial_morning",
        },
    },
};