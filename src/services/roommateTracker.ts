export type RoommateLocation = "casa" | "university";
export type RoommateSentiment = "happy" | "neutral" | "defensive";

export interface RoommateState {
    barrier: number;
    day: number;
    phase: string;
    location: RoommateLocation;
    sentiment: RoommateSentiment;
    humorLabel: string;
}

/**
 * Positive emotional cues that trigger the happy state for Nova
 */
const HAPPY_INDICATORS = [
    "feliz",
    "animad",
    "empolgad",
    "alegr",
    "radiant",
    "bubbly",
    "divertid",
    "rindo",
    "sorri",
    "gargalh",
    "olhos brilham",
    "dá pulinhos",
    "pulando",
    "bate palminhas",
    "vibra",
    "giggles",
    "beaming",
    "waaah",
    "adorou",
    "gostei",
    "obrigad",
    "uhu",
    "✨",
    "mandou bem",
    "fechado",
    "gênio",
    "carinhos",
    "parceir",
    "happy",
    "excited",
    "cheerful",
    "playful",
    "sweet",
];

/**
 * Negative cues that indicate defensiveness or irritation
 */
const DEFENSIVE_INDICATORS = [
    "irritad",
    "brava",
    "furios",
    "desconfiad",
    "territorial",
    "arredi",
    "bufa",
    "revira os olhos",
    "cruza os braços",
    "não gostei",
    "gross",
    "sai daqui",
    "invad",
    "angry",
    "annoyed",
    "guarded",
    "skeptical",
];

const FACULDADE_KEYWORDS = [
    "university",
    "campus",
    "aula",
    "professor",
    "bandejão",
    "bandejao",
    "cafeteria do campus",
    "biblioteca",
    "corredor do campus",
    "sala de aula",
    "universidade",
    "faculdade",
    "college",
    "campus cafe",
    "classroom",
];

const CASA_KEYWORDS = [
    "casa",
    "apê",
    "ape",
    "apartamento",
    "quarto",
    "cozinha",
    "balcão",
    "balcao",
    "sala",
    "banheiro",
    "pia",
    "cama",
    "geladeira",
    "mudança",
    "mudanca",
    "caixas",
    "acordar",
    "café da manhã",
    "cafe da manha",
    "se arrumar",
    "volta pra casa",
    "jantar",
    "noite",
    "dormir",
    "living room",
    "kitchen",
    "bedroom",
];

export const RoommateTrackerService = {
    /**
     * Parses a single message from Nova and extracts her current status,
     * maintaining location & day continuity from the previous known state.
     */
    parseMessageState(
        text: string,
        previousState?: Partial<RoommateState>,
    ): RoommateState {
        const lower = text.toLowerCase();

        // 1. Extract Barrier
        const barrierMatch = text.match(
            /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%([^\]]*)\]/i,
        );
        const barrier = barrierMatch
            ? Math.min(100, Math.max(0, parseInt(barrierMatch[1], 10)))
            : (previousState?.barrier ?? 95);
        const tagExtra = barrierMatch && barrierMatch[2] ? barrierMatch[2] : "";

        // 2. Extract Day
        let day = previousState?.day ?? 1;
        const dayMatch = (tagExtra || text).match(/Dia\s*(\d+)/i);
        if (dayMatch) {
            day = parseInt(dayMatch[1], 10);
        } else if (
            (tagExtra || text).toLowerCase().includes("primeiro dia") ||
            (tagExtra || text).toLowerCase().includes("dia 1")
        ) {
            day = 1;
        }

        // 3. Extract Phase / Routine text
        let phase = previousState?.phase ?? "Primeiro dia de mudança";
        const phaseMatch = tagExtra.match(/(?:Rotina|Dia[^|:]*):\s*([^|\]]+)/i);
        if (phaseMatch) {
            phase = phaseMatch[1].trim();
        }

        // 4. Extract Location (Casa vs Faculdade)
        let location: RoommateLocation = previousState?.location ?? "casa";

        // Explicit tag check (e.g. Local: Casa or Local: University)
        const localTagMatch = tagExtra.match(/Local:\s*([^|\]]+)/i);
        if (localTagMatch) {
            const locStr = localTagMatch[1].toLowerCase().trim();
            if (
                locStr.includes("university") ||
                locStr.includes("faculdade") ||
                locStr.includes("campus") ||
                locStr.includes("aula")
            ) {
                location = "university";
            } else if (
                locStr.includes("casa") ||
                locStr.includes("apê") ||
                locStr.includes("ape") ||
                locStr.includes("apartamento")
            ) {
                location = "casa";
            }
        } else {
            // Heuristic detection based on phase and narrative text
            const phaseLower = phase.toLowerCase();
            const textLower = text.toLowerCase();

            // Check if returned home
            if (
                phaseLower.includes("volta pra casa") ||
                phaseLower.includes("noite") ||
                phaseLower.includes("acordar") ||
                phaseLower.includes("café da manhã") ||
                phaseLower.includes("se arrumar") ||
                phaseLower.includes("mudança") ||
                textLower.includes("chegando no apê") ||
                textLower.includes("de volta ao apê") ||
                textLower.includes("na nossa sala")
            ) {
                location = "casa";
            } else if (
                phaseLower.includes("university") ||
                phaseLower.includes("faculdade") ||
                phaseLower.includes("aula") ||
                phaseLower.includes("campus") ||
                textLower.includes("no campus") ||
                textLower.includes("sala de aula") ||
                textLower.includes("cafeteria da university")
            ) {
                location = "university";
            } else {
                // Check word occurrences
                const universityScore = FACULDADE_KEYWORDS.reduce(
                    (acc, kw) => acc + (textLower.includes(kw) ? 1 : 0),
                    0,
                );
                const casaScore = CASA_KEYWORDS.reduce(
                    (acc, kw) => acc + (textLower.includes(kw) ? 1 : 0),
                    0,
                );

                if (universityScore > casaScore && universityScore >= 2) {
                    location = "university";
                } else if (casaScore > universityScore) {
                    location = "casa";
                }
            }
        }

        // 5. Extract Sentiment & Humor
        let humorLabel = "Normal";
        const humorMatch = tagExtra.match(/Humor:\s*([^|\]]+)/i);
        if (humorMatch) {
            humorLabel = humorMatch[1].trim();
        }

        let sentiment: RoommateSentiment = "neutral";
        const humorLower = humorLabel.toLowerCase();

        const isHappyByHumor = HAPPY_INDICATORS.some((w) =>
            humorLower.includes(w),
        );
        const isDefensiveByHumor = DEFENSIVE_INDICATORS.some((w) =>
            humorLower.includes(w),
        );

        if (isHappyByHumor) {
            sentiment = "happy";
        } else if (isDefensiveByHumor) {
            sentiment = "defensive";
        } else {
            // Content / roleplay text scan
            const happyScore = HAPPY_INDICATORS.reduce(
                (acc, w) => acc + (lower.includes(w) ? 1 : 0),
                0,
            );
            const defensiveScore = DEFENSIVE_INDICATORS.reduce(
                (acc, w) => acc + (lower.includes(w) ? 1 : 0),
                0,
            );

            if (happyScore > defensiveScore && happyScore >= 1) {
                sentiment = "happy";
            } else if (defensiveScore > 0) {
                sentiment = "defensive";
            } else {
                sentiment = "neutral";
            }
        }

        return {
            barrier,
            day,
            phase,
            location,
            sentiment,
            humorLabel,
        };
    },

    /**
     * Traces the whole message history to determine the active room/location,
     * time, and whether a given message should display a rich card image
     */
    shouldShowNovaCard(
        currentMsgId: string,
        messages: { id: string; text: string; sender: string }[],
    ): {
        showCard: boolean;
        imageKey: "happy_home" | "happy_university" | "milestone" | "none";
        location: RoommateLocation;
        sentiment: RoommateSentiment;
    } {
        let runningState: RoommateState = {
            barrier: 95,
            day: 1,
            phase: "Primeiro dia de mudança",
            location: "casa",
            sentiment: "defensive",
            humorLabel: "Desconfiada",
        };

        const MILESTONES = [
            95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15,
            10, 5, 0,
        ];
        const seenMilestones = new Set<number>();

        let targetResult = {
            showCard: false,
            imageKey: "none" as
                | "happy_home"
                | "happy_university"
                | "milestone"
                | "none",
            location: "casa" as RoommateLocation,
            sentiment: "neutral" as RoommateSentiment,
        };

        for (const msg of messages) {
            if (msg.sender !== "character") continue;

            const parsed = this.parseMessageState(msg.text, runningState);
            runningState = parsed;

            if (msg.id === currentMsgId) {
                // Rule 1: Highest priority - 5% Milestone barrier crossing
                let isMilestone = false;
                for (const m of MILESTONES) {
                    if (parsed.barrier <= m && !seenMilestones.has(m)) {
                        seenMilestones.add(m);
                        isMilestone = true;
                        break;
                    }
                }

                if (isMilestone) {
                    targetResult = {
                        showCard: true,
                        imageKey: "milestone",
                        location: parsed.location,
                        sentiment: parsed.sentiment,
                    };
                    break;
                }

                // Rule 2: In-between messages (meio-termos como 98%, 94%, etc.)
                // If she is happy with what the user said, show location-based happy card!
                if (parsed.sentiment === "happy") {
                    targetResult = {
                        showCard: true,
                        imageKey:
                            parsed.location === "university"
                                ? "happy_university"
                                : "happy_home",
                        location: parsed.location,
                        sentiment: parsed.sentiment,
                    };
                    break;
                }

                targetResult = {
                    showCard: false,
                    imageKey: "none",
                    location: parsed.location,
                    sentiment: parsed.sentiment,
                };
                break;
            } else {
                // Record past milestones
                for (const m of MILESTONES) {
                    if (parsed.barrier <= m && !seenMilestones.has(m)) {
                        seenMilestones.add(m);
                        break;
                    }
                }
            }
        }

        return targetResult;
    },
};
