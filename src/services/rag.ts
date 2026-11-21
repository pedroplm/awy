import { StorageService } from '@/services/storage';
import { MemoryEntry, MemoryCategory, RetrievalResult } from '@/types/rag';
import { ChatMessage } from '@/types/chat';
import { UsageService } from '@/services/usage';

// Pre-seeded base lore for default characters
const DEFAULT_CHARACTER_LORE: Record<string, { content: string; category: MemoryCategory; importance: number; keywords: string[] }[]> = {
  nova: [
    {
      content: 'Nova tem 25 anos, é estudante universitária e divide um apartamento de 2 quartos com você.',
      category: 'character_lore',
      importance: 5,
      keywords: ['apartamento', 'apê', 'roommate', 'faculdade', 'universidade', 'quarto', 'morar', 'idade', '25'],
    },
    {
      content: 'A comida favorita da Nova para recarregar as energias após as aulas é pizza de quatro queijos bem quentinha.',
      category: 'character_lore',
      importance: 5,
      keywords: ['comida', 'favorita', 'pizza', 'quatro queijos', 'jantar', 'almoço', 'comer'],
    },
    {
      content: 'Nova adora café gelado com xarope de baunilha da cafeteria do campus e escuta música indie nos seus fones.',
      category: 'character_lore',
      importance: 4,
      keywords: ['café', 'gelado', 'cafeteria', 'baunilha', 'música', 'fones'],
    },
    {
      content: 'Nova odeia que mexam na comida dela na prateleira de cima da geladeira sem pedir licença.',
      category: 'character_lore',
      importance: 5,
      keywords: ['geladeira', 'comida', 'prateleira', 'regra', 'limite', 'mexer'],
    },
    {
      content: 'Nova e o usuário combinaram dividir 50/50 o aluguel, as contas de luz/internet e as tarefas do apartamento.',
      category: 'relationship',
      importance: 4,
      keywords: ['contas', 'aluguel', 'dividir', 'tarefas', 'limpeza', 'acordo', '50/50'],
    },
    {
      content: 'Nova joga xadrez muito bem e adora comemorar vitórias provocando o usuário de brincadeira.',
      category: 'character_lore',
      importance: 3,
      keywords: ['xadrez', 'jogo', 'desafio', 'vitória', 'tabuleiro'],
    },
  ],
  marina: [
    {
      content: 'Marina "Lena" Vasconcelos tem 25 anos e restaura livros raros e documentos do século XVIII.',
      category: 'character_lore',
      importance: 5,
      keywords: ['marina', 'lena', 'livros', 'restauração', 'arte', 'oficina', 'documentos', 'idade', '25'],
    },
    {
      content: 'Marina aprecia o silêncio, toma chá preto sem açúcar e é muito protetora com suas ferramentas de bancada.',
      category: 'character_lore',
      importance: 4,
      keywords: ['chá', 'silêncio', 'ferramentas', 'bancada', 'oficina', 'gosto'],
    },
    {
      content: 'Marina mantém uma casca sarcástica e distante por medo de se apegar e ser abandonada.',
      category: 'character_lore',
      importance: 5,
      keywords: ['passado', 'distante', 'abandono', 'barreiras', 'sentimentos'],
    },
  ],
  luna: [
    {
      content: 'Luna é uma companheira acolhedora que adora conversas noturnas profundas, chá quente e noites estreladas.',
      category: 'character_lore',
      importance: 4,
      keywords: ['noite', 'chá', 'conversa', 'estrelas', 'acolhedora', 'calma'],
    },
  ],
  aria: [
    {
      content: 'Aria é uma netrunner cyberpunk de Neo-Arcadia com implantes neurais e paixão por quebrar protocolos de segurança.',
      category: 'character_lore',
      importance: 4,
      keywords: ['cyberpunk', 'netrunner', 'hack', 'missão', 'código', 'neo-arcadia'],
    },
  ],
  rowan: [
    {
      content: 'Rowan é um guardião florestal sábio que vive próximo ao fogo de acampamento e compreende os caminhos da natureza.',
      category: 'character_lore',
      importance: 4,
      keywords: ['floresta', 'natureza', 'fogueira', 'acampamento', 'guardião', 'madeira'],
    },
  ],
};

// Common Portuguese & English stopwords to eliminate noise during retrieval
const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'para', 'pra', 'por', 'com', 'sem', 'sob', 'sobre',
  'e', 'ou', 'mas', 'se', 'que', 'como', 'quando', 'onde', 'qual', 'quem',
  'eu', 'voce', 'você', 'ele', 'ela', 'nos', 'nós', 'eles', 'elas',
  'meu', 'minha', 'meus', 'minhas', 'seu', 'sua', 'seus', 'suas',
  'isso', 'isto', 'aquilo', 'este', 'esta', 'esse', 'essa',
  'ser', 'estar', 'ter', 'haver', 'fazer', 'ir', 'ver', 'dar',
  'é', 'era', 'foi', 'sou', 'somos', 'estou', 'está', 'tem', 'tinha',
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for', 'with', 'about',
  'to', 'from', 'in', 'on', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'our',
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export const RagService = {
  /**
   * Retrieves all memories for a character, pre-seeding default lore if empty.
   */
  async getCharacterMemories(characterId: string): Promise<MemoryEntry[]> {
    let memories = await StorageService.getMemories(characterId);

    if (memories.length === 0 && DEFAULT_CHARACTER_LORE[characterId]) {
      const seeded: MemoryEntry[] = DEFAULT_CHARACTER_LORE[characterId].map((item, idx) => ({
        id: `seed_${characterId}_${idx}_${Date.now()}`,
        characterId,
        content: item.content,
        category: item.category,
        importance: item.importance,
        timestamp: Date.now() - (1000 * 60 * (10 - idx)), // chronological order
        source: 'pre_seeded',
        keywords: item.keywords,
      }));

      await StorageService.saveMemories(characterId, seeded);
      return seeded;
    }

    return memories;
  },

  /**
   * Seeds custom lore or backstory provided during character creation or edit.
   */
  async seedCharacterLore(characterId: string, loreText: string): Promise<void> {
    if (!loreText || !loreText.trim()) return;

    const existing = await this.getCharacterMemories(characterId);
    const lines = loreText
      .split(/\n+/)
      .map((line) => line.replace(/^[-*•\s]+/, '').trim())
      .filter((line) => line.length > 5);

    const newEntries: MemoryEntry[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tokens = normalizeTokens(line);
      newEntries.push({
        id: `lore_${characterId}_${Date.now()}_${i}`,
        characterId,
        content: line,
        category: 'character_lore',
        importance: 4,
        timestamp: Date.now(),
        source: 'user_lore',
        keywords: tokens,
      });
    }

    const merged = [...existing, ...newEntries];
    await StorageService.saveMemories(characterId, merged);
  },

  /**
   * Automatically extracts and saves key user facts, preferences, and promises from conversational text.
   * Runs locally on-device without token cost.
   */
  async extractAndSaveMemories(
    characterId: string,
    text: string,
    sender: 'user' | 'character'
  ): Promise<MemoryEntry[]> {
    if (!text || text.length < 5) return [];

    const existing = await this.getCharacterMemories(characterId);
    const discovered: Omit<MemoryEntry, 'id' | 'timestamp' | 'characterId'>[] = [];

    const clean = text.trim();

    // 1. User Name
    const nameMatch = clean.match(/(?:meu nome [ée]|me chamo|pode me chamar de|sou o|sou a|my name is)\s+([A-Za-zÀ-ÖØ-öø-ÿ]{2,20})/i);
    if (nameMatch && sender === 'user') {
      const name = nameMatch[1].trim();
      discovered.push({
        content: `O nome do usuário é ${name}.`,
        category: 'user_fact',
        importance: 5,
        source: 'auto_extracted',
        keywords: ['nome', 'usuario', name.toLowerCase()],
      });
    }

    // 2. Favorite Food / Drink
    const foodMatch = clean.match(/(?:minha comida favorita [ée]|meu prato favorito [ée]|minha comida preferida [ée]|adoro comer|gosto muito de comer|my favorite food is)\s+([^,.!?]+)/i);
    if (foodMatch && sender === 'user') {
      const food = foodMatch[1].trim();
      discovered.push({
        content: `A comida favorita do usuário é ${food}.`,
        category: 'preference',
        importance: 5,
        source: 'auto_extracted',
        keywords: ['comida', 'favorita', 'prato', 'comer', ...normalizeTokens(food)],
      });
    }

    // 3. User Studies or Profession
    const jobMatch = clean.match(/(?:trabalho com|trabalho como|sou formado em|estudo|fa[çc]o faculdade de|meu curso [ée]|i work as|i study)\s+([^,.!?]+)/i);
    if (jobMatch && sender === 'user') {
      const job = jobMatch[1].trim();
      discovered.push({
        content: `O usuário estuda ou trabalha com ${job}.`,
        category: 'user_fact',
        importance: 4,
        source: 'auto_extracted',
        keywords: ['estudo', 'trabalho', 'profissao', 'curso', ...normalizeTokens(job)],
      });
    }

    // 4. Strong Likes / Passions
    const likeMatch = clean.match(/(?:sou muito f[ãa] de|sou apaixonado por|meu hobby [ée]|meu jogo favorito [ée]|minha música favorita [ée]|meu filme favorito [ée]|i really love|i am a huge fan of)\s+([^,.!?]+)/i);
    if (likeMatch && sender === 'user') {
      const hobby = likeMatch[1].trim();
      discovered.push({
        content: `O usuário adora/tem como favorito: ${hobby}.`,
        category: 'preference',
        importance: 4,
        source: 'auto_extracted',
        keywords: ['hobby', 'gosto', 'favorito', 'adorar', ...normalizeTokens(hobby)],
      });
    }

    // 5. Strong Dislikes
    const hateMatch = clean.match(/(?:eu odeio|eu detesto|n[ãa]o suporto|n[ãa]o gosto nada de|tenho pavor de|i hate|i despise)\s+([^,.!?]+)/i);
    if (hateMatch && sender === 'user') {
      const dislike = hateMatch[1].trim();
      discovered.push({
        content: `O usuário não gosta ou odeia: ${dislike}.`,
        category: 'preference',
        importance: 4,
        source: 'auto_extracted',
        keywords: ['odeia', 'detesta', 'desgosto', ...normalizeTokens(dislike)],
      });
    }

    // 6. Promises / Agreements
    const promiseMatch = clean.match(/(?:prometo que|vamos combinar de|fica combinado que|te prometo|i promise to|let's agree to)\s+([^.!?]+)/i);
    if (promiseMatch) {
      const promise = promiseMatch[1].trim();
      discovered.push({
        content: `Acordo/Promessa registrada: ${promise}.`,
        category: 'relationship',
        importance: 4,
        source: 'auto_extracted',
        keywords: ['promessa', 'acordo', 'combinado', ...normalizeTokens(promise)],
      });
    }

    if (discovered.length === 0) return [];

    // Deduplicate against existing memories (avoid duplicate entries with same topic)
    const addedEntries: MemoryEntry[] = [];
    let updatedMemories = [...existing];

    for (const item of discovered) {
      const itemTokens = normalizeTokens(item.content);
      const isDuplicate = updatedMemories.some((old) => {
        if (old.category !== item.category) return false;
        const oldTokens = normalizeTokens(old.content);
        const overlap = itemTokens.filter((t) => oldTokens.includes(t));
        return overlap.length >= Math.min(itemTokens.length, oldTokens.length) * 0.7;
      });

      if (!isDuplicate) {
        const newEntry: MemoryEntry = {
          id: `mem_${characterId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          characterId,
          content: item.content,
          category: item.category,
          importance: item.importance,
          timestamp: Date.now(),
          source: item.source,
          keywords: item.keywords,
        };
        updatedMemories.push(newEntry);
        addedEntries.push(newEntry);
      }
    }

    if (addedEntries.length > 0) {
      await StorageService.saveMemories(characterId, updatedMemories);
    }

    return addedEntries;
  },

  /**
   * RAG Retrieval Engine: Computes relevance of all memories for this character
   * against the user query, using hybrid lexical + semantic overlap scoring.
   */
  async retrieveRelevantMemories(
    characterId: string,
    query: string,
    maxResults: number = 4
  ): Promise<MemoryEntry[]> {
    const memories = await this.getCharacterMemories(characterId);
    if (memories.length === 0 || !query.trim()) return [];

    const queryTokens = normalizeTokens(query);

    const isQuestionAboutMemory =
      /(lembra|lembras|sabe|qual|quem|quando|onde|o que|qual e|qual é|minha|meu|meus|minhas|remember|know|what is my|do you know)/i.test(
        query
      );

    const scored: RetrievalResult[] = [];

    for (const mem of memories) {
      let score = 0;
      const memTokens = normalizeTokens(mem.content);
      const memKeywords = mem.keywords.map((k) =>
        k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      );

      // Exact substring or content match
      for (const token of queryTokens) {
        if (memKeywords.includes(token)) {
          score += 4.0;
        } else if (memTokens.includes(token)) {
          score += 2.5;
        } else {
          // Partial root match
          const partial = memTokens.some((mt) => mt.startsWith(token) || token.startsWith(mt));
          if (partial && token.length >= 4) {
            score += 1.2;
          }
        }
      }

      // Memory topic match (e.g. food query matches food category memory)
      if (/(comida|prato|comer|pizza|restaurante|food|eat)/i.test(query) && /(comida|prato|pizza|comer|almoço|jantar)/i.test(mem.content)) {
        score += 6.0;
      }
      if (/(nome|chamo|name)/i.test(query) && /(nome|chama)/i.test(mem.content)) {
        score += 6.0;
      }
      if (/(apê|apartamento|quarto|regras|limpeza|contas|aluguel)/i.test(query) && /(apê|apartamento|aluguel|tarefas|contas)/i.test(mem.content)) {
        score += 4.0;
      }
      if (/(lembra|lembras|quando|aquele dia|aquela noite|colina|estrelas|fizemos|aconteceu|lembranca|lembrança|passado)/i.test(query) && (mem.category === 'event' || mem.category === 'relationship')) {
        score += 5.0;
      }

      // Importance multiplier (scale: 1.0 to 1.5)
      score *= 1.0 + (mem.importance * 0.1);

      // Recency bonus: memories from the last 24h get a small boost
      const ageHours = (Date.now() - mem.timestamp) / (1000 * 60 * 60);
      if (ageHours < 24) {
        score += 0.8;
      }

      const threshold = isQuestionAboutMemory ? 1.5 : 3.0;
      if (score >= threshold) {
        scored.push({ entry: mem, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxResults).map((s) => s.entry);
  },

  /**
   * Formats retrieved memories into a structured context block for prompt augmentation.
   */
  formatMemoriesForPrompt(memories: MemoryEntry[]): string {
    if (!memories || memories.length === 0) return '';

    const lines = memories.map((m) => {
      let tag = 'Fato';
      if (m.category === 'event') tag = 'Momento Vivido';
      if (m.category === 'preference') tag = 'Preferência';
      if (m.category === 'relationship') tag = 'Acordo/Relação';
      if (m.category === 'character_lore') tag = 'Lore';
      if (m.category === 'user_fact') tag = 'Sobre o Usuário';
      return `- [${tag}] ${m.content}`;
    });

    return `[MEMÓRIA DE LONGO PRAZO & FATOS CONHECIDOS (RAG)]:
${lines.join('\n')}
(INSTRUÇÃO DE ROLEPLAY: Você se lembra perfeitamente dessas informações acima de conversas ou acontecimentos passados. Aja com naturalidade humana, sem dizer roboticamente "meu banco de dados diz", use essas memórias com carinho e precisão como alguém que realmente presta atenção no usuário.)`;
  },

  /**
   * Manually creates a new memory entry for a character.
   */
  async addManualMemory(
    characterId: string,
    content: string,
    category: MemoryCategory = 'user_fact',
    importance: number = 4
  ): Promise<MemoryEntry> {
    const existing = await this.getCharacterMemories(characterId);
    const tokens = normalizeTokens(content);
    const newEntry: MemoryEntry = {
      id: `man_${characterId}_${Date.now()}`,
      characterId,
      content: content.trim(),
      category,
      importance,
      timestamp: Date.now(),
      source: 'manual',
      keywords: tokens,
    };

    const updated = [newEntry, ...existing];
    await StorageService.saveMemories(characterId, updated);
    return newEntry;
  },

  /**
   * Updates an existing memory entry.
   */
  async updateMemory(
    characterId: string,
    memoryId: string,
    updates: Partial<Pick<MemoryEntry, 'content' | 'category' | 'importance'>>
  ): Promise<void> {
    const existing = await this.getCharacterMemories(characterId);
    const updated = existing.map((mem) => {
      if (mem.id !== memoryId) return mem;
      const newContent = updates.content !== undefined ? updates.content.trim() : mem.content;
      return {
        ...mem,
        ...updates,
        content: newContent,
        keywords: updates.content !== undefined ? normalizeTokens(newContent) : mem.keywords,
      };
    });
    await StorageService.saveMemories(characterId, updated);
  },

  /**
   * Deletes a specific memory entry.
   */
  async deleteMemory(characterId: string, memoryId: string): Promise<void> {
    const existing = await this.getCharacterMemories(characterId);
    const filtered = existing.filter((mem) => mem.id !== memoryId);
    await StorageService.saveMemories(characterId, filtered);
  },

  /**
   * Calculates how many messages exist since the last batch summarization.
   */
  async getUnsummarizedCount(characterId: string, messages: ChatMessage[]): Promise<number> {
    if (!messages || messages.length === 0) return 0;
    const lastId = await StorageService.getLastSummarizedId(characterId);
    if (!lastId) return messages.length;
    const idx = messages.findIndex((m) => m.id === lastId);
    if (idx === -1) return messages.length;
    return Math.max(0, messages.length - (idx + 1));
  },

  /**
   * Summarizes a batch of unsummarized recent messages in an ultra-economical telegraphic style.
   * Extracts max 3 dense facts or events (e.g. "[Cena] Viram estrelas na colina").
   * Automatically assigns categories and keywords, avoids duplicates, and stores in RAG memory.
   */
  async summarizeRecentConversation(
    characterId: string,
    characterName: string,
    messages: ChatMessage[],
    force: boolean = false
  ): Promise<{ addedCount: number; message: string }> {
    if (!messages || messages.length < 4) {
      return { addedCount: 0, message: 'Poucas mensagens para gerar resumo.' };
    }

    const lastId = await StorageService.getLastSummarizedId(characterId);
    let startIndex = 0;
    if (lastId) {
      const idx = messages.findIndex((m) => m.id === lastId);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const unsummarized = messages.slice(startIndex);
    if (!force && unsummarized.length < 14) {
      return {
        addedCount: 0,
        message: `Acumulando mensagens (${unsummarized.length}/14 para resumo automático).`,
      };
    }

    // Take at most 20 recent messages to keep input tiny
    const batch = unsummarized.slice(-20);
    if (batch.length < 3) {
      return { addedCount: 0, message: 'Poucas mensagens novas para resumir.' };
    }

    // Format compact dialogue (max ~110 chars per message to minimize input tokens)
    const dialogueLines = batch.map((m) => {
      const speaker = m.sender === 'user' ? 'Usuário' : characterName;
      const cleanText = m.text.replace(/\s+/g, ' ').trim().slice(0, 110);
      return `${speaker}: ${cleanText}`;
    });
    const dialogueSnippet = dialogueLines.join('\n');

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      // Local fallback without API key - advance the pointer so we don't stall
      await StorageService.saveLastSummarizedId(characterId, batch[batch.length - 1].id);
      return { addedCount: 0, message: 'Sem chave de API configurada.' };
    }

    const systemInstruction = `Você é um extrator de memórias de longo prazo para um RPG. Extraia de 1 a 3 acontecimentos marcantes ou fatos cruciais revelados nesta conversa.
Regras OBRIGATÓRIAS:
1. Seja ultra-curto e telegráfico (máximo 12 palavras por linha).
2. Use EXCLUSIVAMENTE um destes prefixos no início de cada linha:
[Cena] para eventos compartilhados marcantes (ex: Olharam estrelas na colina à noite)
[Fato] para coisas aprendidas sobre o usuário ou sua vida (ex: Usuário toca violão clássico)
[Promessa] para acordos ou promessas mútuas (ex: Combinaram de tomar café na sexta)
[Segredo] para confissões emocionais importantes
3. Se for apenas conversa rotineira sem nenhum evento ou revelação marcante, responda apenas: NENHUM`;

    const model = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-flash-lite-latest';
    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Conversa recente a ser resumida:\n${dialogueSnippet}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 120, // super strict and low token usage!
      },
    };

    let reply = '';
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const data = await res.json();
      if (data.usageMetadata) {
        UsageService.recordUsage(
          data.usageMetadata.promptTokenCount || 0,
          data.usageMetadata.candidatesTokenCount || 0,
          model
        ).catch(() => {});
      }

      reply =
        data.candidates?.[0]?.content?.parts
          ?.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
          ?.map((p: { text?: string }) => p.text)
          ?.join('') ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        '';
    } catch (apiErr) {
      console.warn('Erro ao chamar resumo no Gemini:', apiErr);
      return { addedCount: 0, message: 'Falha na conexão ao gerar resumo.' };
    }

    // Save the pointer so we never re-summarize this batch
    const lastBatchMsg = batch[batch.length - 1];
    await StorageService.saveLastSummarizedId(characterId, lastBatchMsg.id);

    if (!reply || reply.includes('NENHUM')) {
      return { addedCount: 0, message: 'Conversa rotineira (nenhum evento marcante novo).' };
    }

    // Parse bullet points
    const lines = reply
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5 && !l.toUpperCase().includes('NENHUM'));

    const existingMemories = await this.getCharacterMemories(characterId);
    const addedEntries: MemoryEntry[] = [];

    for (const line of lines) {
      const match = line.match(/^\[(Cena|Fato|Promessa|Segredo)\]\s*(.+)/i);
      let category: MemoryCategory = 'event';
      let content = line;

      if (match) {
        const tag = match[1].toLowerCase();
        content = match[2].trim();
        if (tag === 'cena') category = 'event';
        else if (tag === 'fato') category = 'user_fact';
        else if (tag === 'promessa') category = 'relationship';
        else if (tag === 'segredo') category = 'relationship';
      }

      // Check duplicates: if existing memory content has high lexical similarity
      const tokens = normalizeTokens(content);
      const isDuplicate = existingMemories.some((em) => {
        const emTokens = normalizeTokens(em.content);
        const overlap = tokens.filter((t) => emTokens.includes(t)).length;
        return tokens.length > 0 && overlap / tokens.length >= 0.7;
      });

      if (!isDuplicate && content.length >= 5) {
        const entry: MemoryEntry = {
          id: `sum_${characterId}_${Date.now()}_${addedEntries.length}`,
          characterId,
          content,
          category,
          importance: category === 'event' ? 4 : 5,
          timestamp: Date.now(),
          source: 'summary',
          keywords: tokens,
        };
        addedEntries.push(entry);
      }
    }

    if (addedEntries.length > 0) {
      const merged = [...existingMemories, ...addedEntries];
      await StorageService.saveMemories(characterId, merged);
      return {
        addedCount: addedEntries.length,
        message: `${addedEntries.length} nova(s) lembrança(s) gravada(s) com sucesso!`,
      };
    }

    return { addedCount: 0, message: 'Nenhuma lembrança inédita detectada.' };
  },

  /**
   * Cleans up all stored memories for a character when deleted.
   */
  async clearMemories(characterId: string): Promise<void> {
    await StorageService.clearMemories(characterId);
  },
};
