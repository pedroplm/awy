import { StorageService } from '@/services/storage';
import { MemoryEntry, MemoryCategory, RetrievalResult } from '@/types/rag';

// Pre-seeded base lore for default characters
const DEFAULT_CHARACTER_LORE: Record<string, { content: string; category: MemoryCategory; importance: number; keywords: string[] }[]> = {
  nova: [
    {
      content: 'Nova é estudante universitária e divide um apartamento de 2 quartos com você.',
      category: 'character_lore',
      importance: 5,
      keywords: ['apartamento', 'apê', 'roommate', 'faculdade', 'universidade', 'quarto', 'morar'],
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
      content: 'Marina "Lena" Vasconcelos tem 28 anos e restaura livros raros e documentos do século XVIII.',
      category: 'character_lore',
      importance: 5,
      keywords: ['marina', 'lena', 'livros', 'restauração', 'arte', 'oficina', 'documentos'],
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
   * Cleans up all stored memories for a character when deleted.
   */
  async clearMemories(characterId: string): Promise<void> {
    await StorageService.clearMemories(characterId);
  },
};
