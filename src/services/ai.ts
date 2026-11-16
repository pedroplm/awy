import { Character, ChatMessage } from '@/types/chat';

interface GenerateOptions {
  character: Character;
  history: ChatMessage[];
  userMessage: string;
  onToken?: (token: string) => void;
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
  }: GenerateOptions): Promise<string> {
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (geminiKey) {
      try {
        return await this.callGemini(geminiKey, character, history, userMessage, onToken);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to companion engine:', err);
      }
    } else if (openaiKey) {
      try {
        return await this.callOpenAI(openaiKey, character, history, userMessage, onToken);
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to companion engine:', err);
      }
    }

    // Default built-in roleplay companion engine with real-time streaming
    return this.generateCompanionRoleplay(character, history, userMessage, onToken);
  },

  async callGemini(
    apiKey: string,
    character: Character,
    history: ChatMessage[],
    userMessage: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    // Build alternating message history for Gemini (user <-> model)
    const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    // Filter recent messages (excluding greetings if they precede the first user message)
    const recent = history.slice(-10);
    for (const msg of recent) {
      const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';
      // Ensure alternating roles as required by Gemini API
      if (validHistory.length === 0 && role === 'model') {
        continue;
      }
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
        // Combine consecutive turns of same role
        validHistory[validHistory.length - 1].parts[0].text += `\n${msg.text}`;
      } else {
        validHistory.push({ role, parts: [{ text: msg.text }] });
      }
    }

    // Add current user message
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
      validHistory[validHistory.length - 1].parts[0].text += `\n${userMessage}`;
    } else {
      validHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: character.systemPrompt }],
      },
      contents: validHistory,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 600,
      },
    };

    const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash-8b';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const fullText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      `*smiles warmly* I am always right here with you.`;

    if (onToken) {
      await this.streamSimulatedText(fullText, onToken);
    }

    return fullText;
  },

  async callOpenAI(
    apiKey: string,
    character: Character,
    history: ChatMessage[],
    userMessage: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const messages = [
      { role: 'system', content: character.systemPrompt },
      ...history.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || '*smiles softly* I hear you.';

    if (onToken) {
      await this.streamSimulatedText(fullText, onToken);
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
    onToken?: (token: string) => void
  ): Promise<string> {
    const lower = userMessage.toLowerCase();
    let reply = '';

    if (character.id === 'luna') {
      if (lower.includes('sad') || lower.includes('tired') || lower.includes('stress') || lower.includes('bad')) {
        reply = `*leans in closer with a gentle, comforting gaze* I hear the weight in your words. Please take a slow, deep breath with me... It is okay to feel tired or hurt. You don't have to carry it all by yourself. *reaches out and rests a warm hand on your shoulder* I am right here with you.`;
      } else if (lower.includes('hug') || lower.includes('tea') || lower.includes('warm')) {
        reply = `*wraps both arms around you in a soothing, heartfelt embrace* You are so special to me. Take all the time you need to just exist and feel safe. *smiles softly as she pulls back slightly* Better now?`;
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = `*gives you a warm, tender smile* Hello! My heart always brightens whenever you drop in. How has the world been treating you today?`;
      } else {
        reply = `*listens intently, eyes reflecting soft understanding* That means so much to hear. *tilts head gently* Tell me more about what you are thinking. I want to know everything you wish to share.`;
      }
    } else if (character.id === 'aria') {
      if (lower.includes('trouble') || lower.includes('plan') || lower.includes('hack')) {
        reply = `*grins playfully, adjusting her neural jack* Now that's what I am talking about! If the alarms start ringing, just follow my lead. I already mapped our exit route through Sector 7. *winks* Ready when you are!`;
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = `*spins around on her hover-chair with a smirk* Look who decided to plug back in! Good timing, the neon lights in the district are just kicking on. What's the mission today?`;
      } else {
        reply = `*taps her fingers against the glowing console, considering your words* Hmm, interesting angle. You always keep things exciting, don't you? *leans against the wall with arms crossed and a smirk* Let's see where this road takes us.`;
      }
    } else if (character.id === 'rowan') {
      if (lower.includes('forest') || lower.includes('nature') || lower.includes('quiet')) {
        reply = `*stirs the embers of the fire, sparks floating up into the dark sky* Listen closely... the wind in the pine branches speaks if you are patient enough. *looks toward you with quiet appreciation* Peace is rare out here, but with you, it feels natural.`;
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = `*nods warmly from his seat beside the hearth* Well met, traveler. Sit, warm yourself by the fire. The trail can be harsh, but you are in safe company here.`;
      } else {
        reply = `*takes a slow sip from a carved wooden cup, nodding thoughtfully* Words well spoken. In the quiet of these woods, every story has weight. *gazes toward the horizon* What path shall we take next?`;
      }
    } else if (character.id === 'nova') {
      if (lower.includes('happy') || lower.includes('great') || lower.includes('yay') || lower.includes('fun')) {
        reply = `*jumps up and down with sparkling eyes* Waaaah, that's AMAZING! ✨ I knew you could do it! We totally need to celebrate! *does a goofy little victory dance* High five!!`;
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = `*waves both hands enthusiastically* WAAAH HELLO!! I was just sketching something fun and thinking of you! *beams brightly* What are we doing today?!`;
      } else {
        reply = `*leans forward with wide, curious eyes* Oooooh, really?! Tell me more, tell me more! *claps hands together enthusiastically* I'm all ears!`;
      }
    } else {
      // Custom character fallback
      reply = `*looks at you attentively, reflecting on your words* "${userMessage}"... That resonates with me. *smiles warmly* I am always here with you. What would you like to explore next?`;
    }

    if (onToken) {
      await this.streamSimulatedText(reply, onToken);
    }

    return reply;
  },

  async streamSimulatedText(text: string, onToken: (token: string) => void): Promise<void> {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onToken(word);
      // Small realistic typing delay
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  },
};
