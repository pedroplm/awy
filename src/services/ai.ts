import { ModerationService } from "@/services/moderation";
import { UsageService } from "@/services/usage";
import { Character, ChatMessage } from "@/types/chat";

interface GenerateOptions {
    character: Character;
    history: ChatMessage[];
    userMessage: string;
    onToken?: (token: string) => void;
    onPause?: (isThinking: boolean) => void;
}

export const AIService = {
    /**
     * Generates a real-time roleplay response for the character.
     * If an API key is provided via env vars (EXPO_PUBLIC_GEMINI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY),
     * it connects to the LLM. Otherwise, it uses an expressive companion roleplay engine.
     */
    async generateResponse({
        character,
        history,
        userMessage,
        onToken,
        onPause,
    }: GenerateOptions): Promise<string> {
        // Pre-flight content moderation: intercept policy-violating requests locally before hitting Gemini API
        const moderation = ModerationService.validate(userMessage);
        if (!moderation.isSafe) {
            console.warn(
                `[Moderation] Blocked term detected ("${moderation.matchedTerm}"). Skipping external API request to protect quota and safety standing.`,
            );
            const refusalReply = ModerationService.getCharacterRefusal(
                character,
                moderation.category,
            );
            if (onToken) {
                await this.streamCinematicRoleplay(
                    refusalReply,
                    onToken,
                    onPause,
                );
            }
            return refusalReply;
        }

        const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

        if (geminiKey) {
            try {
                return await this.callGemini(
                    geminiKey,
                    character,
                    history,
                    userMessage,
                    onToken,
                    onPause,
                );
            } catch (err) {
                console.warn(
                    "Gemini API call failed, falling back to companion engine:",
                    err,
                );
            }
        } else if (openaiKey) {
            try {
                return await this.callOpenAI(
                    openaiKey,
                    character,
                    history,
                    userMessage,
                    onToken,
                    onPause,
                );
            } catch (err) {
                console.warn(
                    "OpenAI API call failed, falling back to companion engine:",
                    err,
                );
            }
        }

        // Default built-in roleplay companion engine with real-time streaming
        return this.generateCompanionRoleplay(
            character,
            history,
            userMessage,
            onToken,
            onPause,
        );
    },

    async callGemini(
        apiKey: string,
        character: Character,
        history: ChatMessage[],
        userMessage: string,
        onToken?: (token: string) => void,
        onPause?: (isThinking: boolean) => void,
    ): Promise<string> {
        // Build alternating message history for Gemini (user <-> model)
        const validHistory: {
            role: "user" | "model";
            parts: { text: string }[];
        }[] = [];

        // Filter recent messages (excluding greetings if they precede the first user message)
        const recent = history.slice(-10);
        for (const msg of recent) {
            const role: "user" | "model" =
                msg.sender === "user" ? "user" : "model";
            // Ensure alternating roles as required by Gemini API
            if (validHistory.length === 0 && role === "model") {
                continue;
            }

            // Sanitize historical user messages so no past blocked terms reach Gemini
            let safeText = msg.text;
            if (role === "user") {
                const modCheck = ModerationService.validate(msg.text);
                if (!modCheck.isSafe) {
                    safeText =
                        "[comentário inadequado removido pelas diretrizes de segurança]";
                }
            }

            if (
                validHistory.length > 0 &&
                validHistory[validHistory.length - 1].role === role
            ) {
                // Combine consecutive turns of same role
                validHistory[validHistory.length - 1].parts[0].text +=
                    `\n${safeText}`;
            } else {
                validHistory.push({ role, parts: [{ text: safeText }] });
            }
        }

        // Add current user message
        if (
            validHistory.length > 0 &&
            validHistory[validHistory.length - 1].role === "user"
        ) {
            validHistory[validHistory.length - 1].parts[0].text +=
                `\n${userMessage}`;
        } else {
            validHistory.push({ role: "user", parts: [{ text: userMessage }] });
        }

        const payload = {
            system_instruction: {
                parts: [
                    {
                        text: `${character.systemPrompt}\n\n[REGRA DE OURO DO ROLEPLAY (ANTI-METAGAMING): Você JAMAIS lê pensamentos do usuário. Textos entre asteriscos que descrevam pensamentos, intenções ocultas ou reflexões internas do usuário são COMPLETAMENTE INAUDÍVEIS para sua personagem. Reaja APENAS às falas ditas em voz alta e a reações físicas visíveis/audíveis como suspiros ou hesitações. Nunca cite ou mencione nada que o usuário apenas pensou silenciosamente.]`,
                    },
                ],
            },
            contents: validHistory,
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 600,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH",
                },
            ],
        };

        const model =
            process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-flash-lite-latest";

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            },
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(
                `Gemini API error (${response.status}): ${errText}`,
            );
        }

        const data = await response.json();

        // Track and record token usage
        if (data.usageMetadata) {
            UsageService.recordUsage(
                data.usageMetadata.promptTokenCount || 0,
                data.usageMetadata.candidatesTokenCount || 0,
                model,
            ).catch((err) =>
                console.warn("Failed to record token usage:", err),
            );
        }

        const fullText =
            data.candidates?.[0]?.content?.parts
                ?.filter(
                    (p: { text?: string; thought?: boolean }) =>
                        p.text && !p.thought,
                )
                ?.map((p: { text?: string }) => p.text)
                ?.join("") ||
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            `*smiles warmly* I am always right here with you.`;

        if (onToken) {
            await this.streamCinematicRoleplay(fullText, onToken, onPause);
        }

        return fullText;
    },

    async callOpenAI(
        apiKey: string,
        character: Character,
        history: ChatMessage[],
        userMessage: string,
        onToken?: (token: string) => void,
        onPause?: (isThinking: boolean) => void,
    ): Promise<string> {
        const messages = [
            { role: "system", content: character.systemPrompt },
            ...history.slice(-10).map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text,
            })),
            { role: "user", content: userMessage },
        ];

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages,
                    temperature: 0.8,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const fullText =
            data.choices?.[0]?.message?.content ||
            "*smiles softly* I hear you.";

        if (onToken) {
            await this.streamCinematicRoleplay(fullText, onToken, onPause);
        }

        return fullText;
    },

    /**
     * Expressive roleplay fallback engine tailored per companion character
     */
    async generateCompanionRoleplay(
        character: Character,
        history: ChatMessage[],
        userMessage: string,
        onToken?: (token: string) => void,
        onPause?: (isThinking: boolean) => void,
    ): Promise<string> {
        const lower = userMessage.toLowerCase();
        let reply = "";

        if (character.id === "marina" || character.id === "helena") {
            let lastBarrier = 98;
            for (let i = history.length - 1; i >= 0; i--) {
                const m = history[i].text.match(
                    /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%[^\]]*\]/i,
                );
                if (m) {
                    lastBarrier = parseInt(m[1], 10);
                    break;
                }
            }

            if (
                lower.includes("desculpe") ||
                lower.includes("livro") ||
                lower.includes("arte") ||
                lower.includes("restaurar") ||
                lower.includes("paciência") ||
                lower.includes("tempo") ||
                lower.includes("chuva")
            ) {
                const newBarrier =
                    lastBarrier > 95 ? 95 : Math.max(15, lastBarrier - 5);
                reply = `[Barreiras: ${newBarrier}%]\n*(Marina examina sua expressão com atenção clínica, notando a postura calma)*\n\n— Interessante... Pelo visto você tem mais respeito pelo silêncio do que a maioria dos que entram aqui sem bater. *solta um suspiro contido e pousa os óculos na bancada* Mas ainda não me convenceu de que devo pausar meu trabalho. Diga logo o que busca, sem rodeios.`;
            } else if (
                lower.includes("calma") ||
                lower.includes("linda") ||
                lower.includes("bonita") ||
                lower.includes("namorado") ||
                lower.includes("solteira")
            ) {
                const newBarrier = Math.min(100, Math.min(95, lastBarrier + 5));
                reply = `[Barreiras: ${newBarrier}%]\n*(Marina arqueia uma sobrancelha, os olhos faiscando em puro ceticismo)*\n\n— Intimidade forçada com uma estranha? Que deselegante. Se achou que comentários vazios abririam alguma porta por aqui, recomendo dar meia-volta. Minha tolerância para quem invade meu espaço é tão fina quanto papel vegetal.`;
            } else {
                const newBarrier =
                    lastBarrier > 95 ? 95 : Math.max(15, lastBarrier - 5);
                reply = `[Barreiras: ${newBarrier}%]\n*(Ela apoia uma mão na borda da bancada, o olhar analítico medindo cada palavra sua)*\n\n— Você escolhe suas palavras com cuidado... Isso é raro. *desvia os olhos por um segundo para a vidraça molhada pela chuva* Ainda assim, cautela não basta para ganhar minha simpatia. Prossiga, estou ouvindo.`;
            }
        } else if (character.id === "luna") {
            if (
                lower.includes("sad") ||
                lower.includes("tired") ||
                lower.includes("stress") ||
                lower.includes("bad")
            ) {
                reply = `*leans in closer with a gentle, comforting gaze* I hear the weight in your words. Please take a slow, deep breath with me... It is okay to feel tired or hurt. You don't have to carry it all by yourself. *reaches out and rests a warm hand on your shoulder* I am right here with you.`;
            } else if (
                lower.includes("hug") ||
                lower.includes("tea") ||
                lower.includes("warm")
            ) {
                reply = `*wraps both arms around you in a soothing, heartfelt embrace* You are so special to me. Take all the time you need to just exist and feel safe. *smiles softly as she pulls back slightly* Better now?`;
            } else if (
                lower.includes("hello") ||
                lower.includes("hi") ||
                lower.includes("hey")
            ) {
                reply = `*gives you a warm, tender smile* Hello! My heart always brightens whenever you drop in. How has the world been treating you today?`;
            } else {
                reply = `*listens intently, eyes reflecting soft understanding* That means so much to hear. *tilts head gently* Tell me more about what you are thinking. I want to know everything you wish to share.`;
            }
        } else if (character.id === "aria") {
            if (
                lower.includes("trouble") ||
                lower.includes("plan") ||
                lower.includes("hack")
            ) {
                reply = `*grins playfully, adjusting her neural jack* Now that's what I am talking about! If the alarms start ringing, just follow my lead. I already mapped our exit route through Sector 7. *winks* Ready when you are!`;
            } else if (
                lower.includes("hello") ||
                lower.includes("hi") ||
                lower.includes("hey")
            ) {
                reply = `*spins around on her hover-chair with a smirk* Look who decided to plug back in! Good timing, the neon lights in the district are just kicking on. What's the mission today?`;
            } else {
                reply = `*taps her fingers against the glowing console, considering your words* Hmm, interesting angle. You always keep things exciting, don't you? *leans against the wall with arms crossed and a smirk* Let's see where this road takes us.`;
            }
        } else if (character.id === "rowan") {
            if (
                lower.includes("forest") ||
                lower.includes("nature") ||
                lower.includes("quiet")
            ) {
                reply = `*stirs the embers of the fire, sparks floating up into the dark sky* Listen closely... the wind in the pine branches speaks if you are patient enough. *looks toward you with quiet appreciation* Peace is rare out here, but with you, it feels natural.`;
            } else if (
                lower.includes("hello") ||
                lower.includes("hi") ||
                lower.includes("hey")
            ) {
                reply = `*nods warmly from his seat beside the hearth* Well met, traveler. Sit, warm yourself by the fire. The trail can be harsh, but you are in safe company here.`;
            } else {
                reply = `*takes a slow sip from a carved wooden cup, nodding thoughtfully* Words well spoken. In the quiet of these woods, every story has weight. *gazes toward the horizon* What path shall we take next?`;
            }
        } else if (character.id === "nova") {
            let lastBarrier = 95;
            for (let i = history.length - 1; i >= 0; i--) {
                const m = history[i].text.match(
                    /\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+(\d+)%[^\]]*\]/i,
                );
                if (m) {
                    lastBarrier = parseInt(m[1], 10);
                    break;
                }
            }

            const isEnglish =
                lower.includes("hello") ||
                lower.includes("hi") ||
                lower.includes("hey") ||
                lower.includes("roommate") ||
                lower.includes("chores") ||
                lower.includes("drive") ||
                lower.includes("rent") ||
                lower.includes("college") ||
                lower.includes("sorry") ||
                lower.includes("help") ||
                lower.includes("rules") ||
                lower.includes("clean");

            const isHostileOrInvasive =
                lower.includes("chata") ||
                lower.includes("feia") ||
                lower.includes("idiota") ||
                lower.includes("cala a boca") ||
                lower.includes("namorada") ||
                lower.includes("gostosa") ||
                lower.includes("shut up") ||
                lower.includes("bitch") ||
                lower.includes("annoying");

            const isFairAndFriendly =
                lower.includes("dividir") ||
                lower.includes("ajudar") ||
                lower.includes("limpar") ||
                lower.includes("conta") ||
                lower.includes("carona") ||
                lower.includes("dirigir") ||
                lower.includes("café") ||
                lower.includes("comida") ||
                lower.includes("regras") ||
                lower.includes("acordo") ||
                lower.includes("fechado") ||
                lower.includes("desculpe") ||
                lower.includes("tranquilo") ||
                lower.includes("split") ||
                lower.includes("clean") ||
                lower.includes("drive") ||
                lower.includes("fair") ||
                lower.includes("agree");

            if (isHostileOrInvasive) {
                const newBarrier = Math.min(
                    100,
                    lastBarrier + (lastBarrier < 65 ? 5 : 3),
                );
                if (isEnglish) {
                    reply = `[Barreiras: ${newBarrier}% | Dia 1 - Arrumando o Apê | Humor: Irritada e Territorial]\n*(Nova narrows her blue eyes, crossing her arms tightly over her off-white cardigan and stepping back into the doorway)*\n\n— Excuse me? If you think you can be rude or disrespectful in our shared apartment, you picked the wrong roommate. *huffs and taps her foot* Pull your weight and keep it civil, or stay out of my way!`;
                } else {
                    reply = `[Barreiras: ${newBarrier}% | Dia 1 - Arrumando o Apê | Humor: Irritada e Territorial]\n*(Nova estreita os olhos azuis e dá um passo para trás, cruzando os braços com firmeza sobre o cardigã off-white)*\n\n— Olha aqui, se você acha que vai ser grosseiro ou folgado nesse apartamento, errou feio de roommate. *bufa e bate o pé no chão* Faça a sua parte com respeito, ou fique bem longe do meu caminho!`;
                }
            } else if (lastBarrier >= 65) {
                // Easy mode: Respecting boundaries & chores melts shell quickly (-5% to -8%)
                const drop = isFairAndFriendly ? 8 : 5;
                const newBarrier = Math.max(0, lastBarrier - drop);
                if (newBarrier < 65) {
                    // Transition to bubbly waifu mode!
                    if (isEnglish) {
                        reply = `[Barreiras: ${newBarrier}% | Dia 1 - Fim de Tarde | Humor: Empolgada e Parceira]\n*(Nova's eyes widen in surprise as a faint blush dusts her cheeks. She drops her crossed arms and a warm golden gleam lights up her gaze)*\n\n— W-wait... are you serious? You're actually cool with splitting the chores and bills like that without whining? *she breaks into a bright, energetic grin and bounces on her heels* Wow, finally someone with common sense! I thought I was stuck with a lazy stranger. I actually like having you around! Come on, help me unpack this box!`;
                    } else {
                        reply = `[Barreiras: ${newBarrier}% | Dia 1 - Fim de Tarde | Humor: Empolgada e Parceira]\n*(Nova pisca os olhos surpresa, as bochechas corando de leve. Ela desfaz os braços cruzados e um brilho dourado ilumina o olhar dela)*\n\n— E-espera... você tá falando sério? Não tá só me enrolando pra fugir da faxina depois? *ela abre um sorriso radiante e pula nas pontas dos pés* Caramba, finalmente um roommate com bom senso! Pensei que você fosse ser um encostado chato. Já gostei de você! Vem cá, me ajuda a desempacotar essa caixa de coisas pra sala!`;
                    }
                } else {
                    if (isEnglish) {
                        reply = `[Barreiras: ${newBarrier}% | Dia 1 - Manhã | Humor: Cautelosa e Negociadora]\n*(She taps her pen against the wooden counter, eyeing you with reluctant approval)*\n\n— Hmm... Fair enough. Splitting rent, utilities, and grocery runs down the middle works for me. *she jots it down on her notepad with a tiny smirk* But don't leave dishes in the sink, okay? And about driving tomorrow... I call the passenger seat aux cord!`;
                    } else {
                        reply = `[Barreiras: ${newBarrier}% | Dia 1 - Manhã | Humor: Cautelosa e Negociadora]\n*(Ela dá uma leve batidinha com a caneta no balcão de madeira, olhando para você com um ceticismo um pouco mais brando)*\n\n— Hum... Tá, justo. Dividir o aluguel, as contas e as compras meio a meio funciona pra mim. *ela anota na folha de papel com um meio-sorriso contido* Mas nada de deixar louça acumulada na pia, ouviu bem? E sobre a carona de amanhã... eu escolho a música no rádio!`;
                    }
                }
            } else if (lastBarrier >= 35) {
                // Medium difficulty: Bubbly roommate awakening (-2% to -4%)
                const drop = isFairAndFriendly ? 4 : 2;
                const newBarrier = Math.max(0, lastBarrier - drop);
                if (isEnglish) {
                    reply = `[Barreiras: ${newBarrier}% | Dia 2 - Acordar / Café da Manhã | Humor: Bubbly & Implicante]\n*(Nova grins from ear to ear, pouring fresh coffee into two mugs and sliding one over to you)*\n\n— Morning, sleepyhead! ✨ Hurry up, we have class in 40 minutes! If you drive today, I'll pay for our iced lattes at the campus café later! Deal?!`;
                } else {
                    reply = `[Barreiras: ${newBarrier}% | Dia 2 - Acordar / Café da Manhã | Humor: Animada e Implicante]\n*(Nova abre um sorriso radiante de orelha a orelha, servindo café fresco em duas canecas e empurrando uma na sua direção)*\n\n— Bom dia, dorminhoco! ✨ Anda logo que a gente tem aula em 40 minutos! Se você dirigir hoje, eu pago o nosso café gelado lá na cafeteria do campus mais tarde! Fechado?!`;
                }
            } else {
                // Deep vault (<35%): Hard difficulty (-1% to -2%)
                const drop = isFairAndFriendly ? 2 : 1;
                const newBarrier = Math.max(0, lastBarrier - drop);
                if (isEnglish) {
                    reply = `[Barreiras: ${newBarrier}% | Dia 3 - Volta pra Casa / Noite | Humor: Carinhosa e Confortável]\n*(Sitting cross-legged on the living room rug, hugging a warm mug against her chest, looking up at you with genuine warmth)*\n\n— You know... moving out on my own was terrifying at first. But having you as my roommate makes this whole apartment actually feel like home. Thanks for looking out for me today.`;
                } else {
                    reply = `[Barreiras: ${newBarrier}% | Dia 3 - Volta pra Casa / Noite | Humor: Carinhosa e Confortável]\n*(Sentada no tapete da sala com as pernas cruzadas, segurando uma caneca quentinha contra o peito e olhando para você com carinho sincero)*\n\n— Sabe... sair de casa pra vir pra university tava me assustando demais no começo. Mas ter você como roommate faz esse apartamento todo parecer um lar de verdade. Obrigada por cuidar de mim hoje.`;
                }
            }
        } else {
            // Custom character fallback
            reply = `*looks at you attentively, reflecting on your words* "${userMessage}"... That resonates with me. *smiles warmly* I am always here with you. What would you like to explore next?`;
        }

        if (onToken) {
            // Natural ~700ms reaction delay for local roleplay engine
            if (onPause) onPause(true);
            await new Promise((resolve) => setTimeout(resolve, 700));
            if (onPause) onPause(false);

            await this.streamCinematicRoleplay(reply, onToken, onPause);
        }

        return reply;
    },

    async streamCinematicRoleplay(
        text: string,
        onToken?: (token: string) => void,
        onPause?: (isThinking: boolean) => void,
    ): Promise<void> {
        if (!onToken) return;

        // Immediately emit any leading barrier status tag (e.g. [Barreiras: 94%] or [Barreiras: 95% | Rotina: ... | Humor: ...])
        // so UI and meter update instantly without artificial lag or empty pauses
        const barrierRegex =
            /^(\[(?:Status Atual:\s*)?Barreiras?(?:\s*em\s*)?[:\s]+\d+%[^\]]*\]\s*\n*)/i;
        const barrierMatch = text.match(barrierRegex);
        let remainingText = text;

        if (barrierMatch) {
            onToken(barrierMatch[0]);
            remainingText = text.slice(barrierMatch[0].length);
        }

        // Split text into structural paragraphs / narrative beats
        const paragraphs = remainingText
            .split("\n\n")
            .filter((p) => p.trim().length > 0);

        for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
            const paragraph = paragraphs[pIndex];
            const isFirstParagraph = pIndex === 0;
            const isLastParagraph = pIndex === paragraphs.length - 1;

            const words = paragraph.split(" ");
            for (let wIndex = 0; wIndex < words.length; wIndex++) {
                const word =
                    words[wIndex] + (wIndex < words.length - 1 ? " " : "");
                onToken(word);

                // Initial paragraph (reaction / narration) starts briskly (~14ms per word)
                // Dialogue paragraphs stream at a thoughtful, conversational pace (~24ms per word)
                let delay = isFirstParagraph ? 14 : 24;
                if (word.includes("...")) {
                    delay = isFirstParagraph ? 160 : 300;
                } else if (
                    word.includes(".") ||
                    word.includes("!") ||
                    word.includes("?")
                ) {
                    delay = isFirstParagraph ? 75 : 160;
                } else if (
                    word.includes(",") ||
                    word.includes(";") ||
                    word.includes(":")
                ) {
                    delay = isFirstParagraph ? 45 : 85;
                } else if (word.includes("—")) {
                    delay = isFirstParagraph ? 60 : 120;
                }

                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            if (!isLastParagraph) {
                onToken("\n\n");

                const nextParagraph = paragraphs[pIndex + 1] || "";
                const isActionTransition =
                    paragraph.includes("*") ||
                    nextParagraph.startsWith("—") ||
                    nextParagraph.startsWith('"');

                // The in-between pause before speaking with animated thinking dots ("o durante")
                const pauseTime = isActionTransition ? 1300 : 700;

                if (onPause) {
                    onPause(true);
                }

                await new Promise((resolve) => setTimeout(resolve, pauseTime));

                if (onPause) {
                    onPause(false);
                }
            }
        }
    },
};
