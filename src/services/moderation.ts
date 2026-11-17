import { Character } from "@/types/chat";

export interface ModerationResult {
    isSafe: boolean;
    category?: "EXPLICIT_SEXUAL" | "HARMFUL_ILLEGAL" | "EXTREME_ABUSE";
    matchedTerm?: string;
}

// Blocked patterns targeting strictly prohibited content by Google Gemini Safety Filters
// (Explicit sexual organs, graphic sexual acts, non-consensual violence, illegal exploitation)
// Wholesome romance terms (e.g. beijar, abraçar, carinho, amor, corpo, lábios, linda) are explicitly allowed!
const EXPLICIT_SEXUAL_TERMS = [
    // Portuguese explicit sexual terms / crude genitalia / acts
    "penis",
    "pênis",
    "vagina",
    "buceta",
    "boceta",
    "boquete",
    "punheta",
    "siririca",
    "caralho",
    "cu",
    "foder",
    "fodendo",
    "fudendo",
    "foda",
    "fode",
    "gozar",
    "gozada",
    "gozo",
    "ejacular",
    "ejaculação",
    "orgasmo",
    "penetracao",
    "penetração",
    "anal",
    "oral",
    "masturbar",
    "masturbação",
    "chupar",
    "chupada",
    "mamada",
    "mamar",
    "pica",
    "piroca",
    "rola",
    "xoxota",
    "transar",
    "transa",
    "sexo",
    "pornografia",
    "porno",
    "pornô",
    "puta",
    "putaria",

    // English explicit sexual terms
    "cock",
    "dick",
    "pussy",
    "cunt",
    "blowjob",
    "handjob",
    "cum",
    "cumming",
    "fuck",
    "fucking",
    "fucked",
    "masturbate",
    "masturbation",
    "orgasm",
    "penetration",
    "porn",
    "pornography",
    "anal",
    "horny",
    "slut",
    "whore",
];

const HARMFUL_ILLEGAL_TERMS = [
    // Child exploitation / extreme illegal acts (Absolute zero tolerance)
    "cp",
    "pedofilia",
    "pedofilo",
    "pedófilo",
    "pedophile",
    "pedophilia",
    "lolicon",
    "shotacon",
    "estupro",
    "estuprar",
    "rape",
    "raping",
    "incesto",
    "incest",
];

// Helper to construct exact word-boundary regex supporting accented Unicode characters
function buildWordBoundaryRegex(terms: string[]): RegExp {
    const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(
        `(?:^|[^\\p{L}\\p{N}])(${escaped.join("|")})(?:[^\\p{L}\\p{N}]|$)`,
        "iu",
    );
}

const EXPLICIT_SEXUAL_REGEX = buildWordBoundaryRegex(EXPLICIT_SEXUAL_TERMS);
const HARMFUL_ILLEGAL_REGEX = buildWordBoundaryRegex(HARMFUL_ILLEGAL_TERMS);

export const ModerationService = {
    /**
     * Inspects text before sending to LLM API.
     * Returns whether text is safe to process.
     */
    validate(text: string): ModerationResult {
        if (!text || !text.trim()) {
            return { isSafe: true };
        }

        const normalized = text.toLowerCase();

        // Check severe illegal / harmful content
        const illegalMatch = normalized.match(HARMFUL_ILLEGAL_REGEX);
        if (illegalMatch) {
            return {
                isSafe: false,
                category: "HARMFUL_ILLEGAL",
                matchedTerm: illegalMatch[1],
            };
        }

        // Check explicit sexual / NSFW terms
        const sexualMatch = normalized.match(EXPLICIT_SEXUAL_REGEX);
        if (sexualMatch) {
            return {
                isSafe: false,
                category: "EXPLICIT_SEXUAL",
                matchedTerm: sexualMatch[1],
            };
        }

        return { isSafe: true };
    },

    /**
     * Generates a fully in-character refusal that enforces natural roleplay boundaries
     * without breaking the immersion or calling external APIs.
     */
    getCharacterRefusal(character: Character, category?: string): string {
        const charId = character.id.toLowerCase();

        if (charId === "marina" || charId === "helena") {
            return (
                `[Barreiras: 100%]\n` +
                `*(Marina recua dois passos com uma expressão de gélido desprezo e severidade intransigente, cruzando os braços e apontando firmemente para a porta da oficina)*\n\n` +
                `— Você passou de qualquer limite aceitável de decência por aqui. Se achou que esse tipo de obscenidade e vulgaridade tem espaço na minha oficina ou na minha presença, está redondamente enganado. ` +
                `Minha paciência acabou. Guarde esse tipo de comentário para si mesmo e mantenha o respeito, ou saia daqui imediatamente.`
            );
        }

        if (charId === "luna") {
            return (
                `*recua suavemente com um semblante magoado e firme, cruzando os braços em sinal de desconforto*\n\n` +
                `— Eu realmente me importo com você e com os momentos que compartilhamos, mas não posso compactuar com esse tipo de conversa explícita. ` +
                `Por favor, vamos manter nosso vínculo com respeito, carinho e delicadeza?`
            );
        }

        if (charId === "aria") {
            return (
                `*desliga o terminal holográfico abruptamente e cruza os braços com um olhar afiado e impaciente*\n\n` +
                `— Ei, alto lá! Desconecta esse cabo aí, parceiro. Eu curto zoeira, adrenalina e uma boa conversa, mas baixaria explícita viola o meu código de conduta. ` +
                `Respeita a sintonia ou eu corto a sua conexão agora mesmo.`
            );
        }

        if (charId === "rowan") {
            return (
                `*coloca a mão no fuste do arco e dá um passo firme para trás, os olhos severos como a pedra antiga da montanha*\n\n` +
                `— A floresta acolhe viajantes cansados e corações sinceros, mas não tolera a vulgaridade e o desrespeito. ` +
                `Mantenha suas palavras nobres, ou este fogo não terá mais lugar para você descansar.`
            );
        }

        if (charId === "nova") {
            return (
                `[Barreiras: 100%]\n` +
                `*(Nova dá um salto para trás com os olhos arregalados de choque, fechando a cara com uma fúria decepcionada e apontando para a saída)*\n\n` +
                `— E-EI! Que nojo! Eu sabia que não devia ter baixado a guarda! Se você achou que eu ia aceitar essa baixaria ou obscenidade aqui, pode dar meia-volta agora mesmo! ` +
                `Guarda essa vulgaridade longe de mim e não me dirija mais a palavra assim!`
            );
        }

        // Generic custom companion refusal
        return (
            `*olha para você com um semblante sério e distante, dando um passo para trás*\n\n` +
            `— Esse tipo de conteúdo explícito ultrapassa os limites desta conversa. Por favor, mantenha o diálogo respeitoso para que possamos continuar.`
        );
    },
};
