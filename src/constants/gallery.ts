import { GalleryPhoto } from '@/types/gallery';
import { NOVA_STAGE_IMAGES, MARINA_STAGE_IMAGES } from './characters';

export const NOVA_GALLERY: GalleryPhoto[] = [
  {
    id: 'nova_100',
    characterId: 'nova',
    title: 'Início da Convivência',
    description:
      'Primeiro dia no apartamento compartilhado. Braços cruzados no cardigã off-white e olhar territorial marcando as regras da casa.',
    hint: 'Desbloqueado automaticamente no início da jornada com a Nova.',
    imageSource: NOVA_STAGE_IMAGES[100],
    barrierRequired: 100,
    category: 'barrier',
    badge: '100% Barreiras',
  },
  {
    id: 'nova_90',
    characterId: 'nova',
    title: 'Reflexiva & Curiosa',
    description:
      'Apoiada com a mão no queixo, ouvindo atentamente suas ideias enquanto analisa a sua personalidade.',
    hint: 'Baixe as barreiras para 90% ou debata sobre projetos, ideias e rotina.',
    imageSource: NOVA_STAGE_IMAGES[90],
    barrierRequired: 90,
    category: 'barrier',
    badge: '90% Barreiras',
  },
  {
    id: 'nova_car',
    characterId: 'nova',
    title: 'Carona para o Campus',
    description:
      'No banco do passageiro dividindo o trânsito da manhã a caminho da faculdade, conversando sobre as aulas e o dia pela frente.',
    hint: 'Baixe as barreiras para 80% ou comente sobre carro, carona, trânsito ou faculdade.',
    imageSource: NOVA_STAGE_IMAGES.car,
    barrierRequired: 80,
    category: 'situational',
    badge: 'Rotina Matinal',
  },
  {
    id: 'nova_sofa',
    characterId: 'nova',
    title: 'Companhia no Sofá',
    description:
      'Sentada bem pertinho no sofá da sala, dividindo o cansaço do dia com uma sensação reconfortante de silêncio compartilhado.',
    hint: 'Baixe as barreiras para 70% ou chame-a para assistir algo ou relaxar no sofá.',
    imageSource: NOVA_STAGE_IMAGES.sofa,
    barrierRequired: 70,
    category: 'situational',
    badge: 'Sala de Estar',
  },
  {
    id: 'nova_shy',
    characterId: 'nova',
    title: 'Tímida & Desarmada',
    description:
      'Bochechas coradas e olhar desviado de lado, tentando sem sucesso esconder o desconforto doce com os primeiros elogios sinceros.',
    hint: 'Baixe as barreiras para 60% ou elogie Nova, deixando-a tímida e sem graça.',
    imageSource: NOVA_STAGE_IMAGES.shy,
    barrierRequired: 60,
    category: 'situational',
    badge: 'Vulnerabilidade',
  },
  {
    id: 'nova_happy_home',
    characterId: 'nova',
    title: 'Alegria no Apartamento',
    description:
      'Sorriso contagiante, pulinhos animados de comemoração e olhar brilhando na sala do apartamento.',
    hint: 'Baixe as barreiras para 50% ou faça Nova rir e comemorar algo em casa.',
    imageSource: NOVA_STAGE_IMAGES.happy_home,
    barrierRequired: 50,
    category: 'situational',
    badge: 'No Apê',
  },
  {
    id: 'nova_grass',
    characterId: 'nova',
    title: 'Paz na Grama do Campus',
    description:
      'Deitada no gramado da universidade sob o sol morno da tarde, respirando fundo e sentindo-se segura ao seu lado.',
    hint: 'Baixe as barreiras para 40% ou convide-a para relaxar na grama ao ar livre.',
    imageSource: NOVA_STAGE_IMAGES.grass,
    barrierRequired: 40,
    category: 'situational',
    badge: 'Ao Ar Livre',
  },
  {
    id: 'nova_hugging',
    characterId: 'nova',
    title: 'Abraço Acolhedor',
    description:
      'Envolvendo você com carinho sincero e alívio profundo, desarmando os medos e as inseguranças do passado.',
    hint: 'Baixe as barreiras para 30% ou compartilhe um abraço acolhedor na conversa.',
    imageSource: NOVA_STAGE_IMAGES.hugging,
    barrierRequired: 30,
    category: 'situational',
    badge: 'Afeto Sincero',
  },
  {
    id: 'nova_night_bed',
    characterId: 'nova',
    title: 'Noite de Confiança',
    description:
      'Deitada sob as cobertas na penumbra aconchegante do quarto, conversando sem filtros até tarde da noite.',
    hint: 'Baixe as barreiras para 20% ou conversem deitados na cama sobre sonhos e segredos.',
    imageSource: NOVA_STAGE_IMAGES.night_bed,
    barrierRequired: 20,
    category: 'situational',
    badge: 'Penumbra & Paz',
  },
  {
    id: 'nova_kiss',
    characterId: 'nova',
    title: 'O Primeiro Beijo',
    description:
      'Olhos fechados, respiração curta e coração acelerado. A entrega completa de afeto e carinho acumulados.',
    hint: 'Baixe as barreiras para 10% ou compartilhe um beijo romântico nos lábios.',
    imageSource: NOVA_STAGE_IMAGES.kiss,
    barrierRequired: 10,
    category: 'special',
    badge: 'Romance Puro',
  },
  {
    id: 'nova_0',
    characterId: 'nova',
    title: 'Conexão Total & Intimidade',
    description:
      'Cumplicidade absoluta e ternura sem barreiras. O apartamento finalmente se transformou em um lar aconchegante.',
    hint: 'Alcance o nível máximo de intimidade quebrando 100% das barreiras (0%).',
    imageSource: NOVA_STAGE_IMAGES[0],
    barrierRequired: 0,
    category: 'barrier',
    badge: 'Ápice de Intimidade',
  },
  {
    id: 'nova_on_top',
    characterId: 'nova',
    title: 'Sem Distâncias',
    description:
      'Olhar penetrante e proximidade irresistível em um momento íntimo onde nenhuma barreira mais existe.',
    hint: 'Alcance momentos de máxima proximidade e cumplicidade com Nova.',
    imageSource: NOVA_STAGE_IMAGES.on_top,
    barrierRequired: 15,
    category: 'special',
    badge: 'Momento Especial',
  },
  {
    id: 'nova_layed_thinking',
    characterId: 'nova',
    title: 'Olhar para o Teto',
    description:
      'Deitada de lado olhando para cima com expressão pensativa, refletindo sobre o rumo das suas vidas e projetos.',
    hint: 'Converse sobre sonhos de vida, futuro ou incertezas deitados.',
    imageSource: NOVA_STAGE_IMAGES.layed_thinking,
    barrierRequired: 50,
    category: 'situational',
    badge: 'Reflexões',
  },
  {
    id: 'nova_window',
    characterId: 'nova',
    title: 'Chuva na Janela',
    description:
      'Observando as gotas de chuva escorrerem pelo vidro da sala, com um olhar nostálgico e a calma de estar em casa.',
    hint: 'Comente sobre a chuva lá fora ou sobre olhar pela janela.',
    imageSource: NOVA_STAGE_IMAGES.window,
    barrierRequired: 75,
    category: 'situational',
    badge: 'Dia Chuvoso',
  },
  {
    id: 'nova_happy',
    characterId: 'nova',
    title: 'Sorriso Radiante',
    description:
      'Expressão luminosa e risada gostosa, demonstrando alegria pura sem nenhuma desconfiança.',
    hint: 'Faça Nova sorrir com sinceridade em um momento alegre.',
    imageSource: NOVA_STAGE_IMAGES.happy,
    barrierRequired: 65,
    category: 'situational',
    badge: 'Espontânea',
  },
  {
    id: 'nova_happy_university',
    characterId: 'nova',
    title: 'Pelos Corredores do Campus',
    description:
      'Entusiasmada e com passos leves entre as salas de aula da faculdade, animada para o que vem a seguir.',
    hint: 'Interaja com ela feliz e entusiasmada durante a rotina na faculdade.',
    imageSource: NOVA_STAGE_IMAGES.happy_university,
    barrierRequired: 55,
    category: 'situational',
    badge: 'No Campus',
  },
  {
    id: 'nova_morning_bed',
    characterId: 'nova',
    title: 'Luz da Manhã',
    description:
      'Acordando com a luz do sol entrando suave pela fresta da cortina, ainda sob as cobertas quentinhas.',
    hint: 'Deseje bom dia ou conversem logo cedo ao acordar com barreiras baixas.',
    imageSource: NOVA_STAGE_IMAGES.morning_bed,
    barrierRequired: 35,
    category: 'situational',
    badge: 'Amanhecer',
  },
  {
    id: 'nova_morning_bed_close',
    characterId: 'nova',
    title: 'Manhã Acolhedora',
    description:
      'Olhar preguiçoso e sorriso doce bem pertinho, dividindo o calor da cama antes de levantar.',
    hint: 'Acordem juntos e bem pertinho na cama com barreiras em 30% ou menos.',
    imageSource: NOVA_STAGE_IMAGES.morning_bed_close,
    barrierRequired: 30,
    category: 'special',
    badge: 'Despertar a Dois',
  },
];

export const MARINA_GALLERY: GalleryPhoto[] = [
  {
    id: 'marina_90',
    characterId: 'marina',
    title: 'Cética & Distante',
    description:
      'Olhar cortante e braços cruzados na oficina de restauração. Defesas rígidas e tédio contido diante de invasões.',
    hint: 'Desbloqueado no início da conversa com a Marina.',
    imageSource: MARINA_STAGE_IMAGES[90],
    barrierRequired: 90,
    category: 'barrier',
    badge: '90% - 100%',
  },
  {
    id: 'marina_80',
    characterId: 'marina',
    title: 'Avaliando em Silêncio',
    description:
      'Observação atenta e postura reflexiva. Analisa suas palavras com cautela para testar suas intenções.',
    hint: 'Baixe as barreiras para 80% respeitando o ritmo e o silêncio da oficina.',
    imageSource: MARINA_STAGE_IMAGES[80],
    barrierRequired: 80,
    category: 'barrier',
    badge: '80% - 89%',
  },
  {
    id: 'marina_70',
    characterId: 'marina',
    title: 'Leve Curiosidade',
    description:
      'Semicerrou o olhar com interesse genuíno. O sarcasmo perde a ponta afiada e dá lugar a perguntas reais.',
    hint: 'Baixe as barreiras para 70% conversando com sensibilidade sobre arte ou livros.',
    imageSource: MARINA_STAGE_IMAGES[70],
    barrierRequired: 70,
    category: 'barrier',
    badge: '70% - 79%',
  },
  {
    id: 'marina_60',
    characterId: 'marina',
    title: 'Defesas Fendidas',
    description:
      'Postura relaxada e atenta na bancada. As defesas começam a se desfazer diante da sua consistência.',
    hint: 'Baixe as barreiras para 60% mostrando paciência e respeito constante.',
    imageSource: MARINA_STAGE_IMAGES[60],
    barrierRequired: 60,
    category: 'barrier',
    badge: '60% - 69%',
  },
  {
    id: 'marina_40',
    characterId: 'marina',
    title: 'Abrindo o Coração',
    description:
      'Olhar suave e vulnerabilidade emergente. Começa a compartilhar pequenos fragmentos do passado e de suas dores.',
    hint: 'Baixe as barreiras para 40% acolhendo suas inseguranças sem pressionar.',
    imageSource: MARINA_STAGE_IMAGES[40],
    barrierRequired: 40,
    category: 'barrier',
    badge: '40% - 59%',
  },
  {
    id: 'marina_30',
    characterId: 'marina',
    title: 'Conexão Profunda',
    description:
      'Olhar cúmplice e barreiras quase invisíveis. Um sorriso raro e carinhoso que poucos tiveram o privilégio de ver.',
    hint: 'Baixe as barreiras para 30% provando que sua presença é segura e leal.',
    imageSource: MARINA_STAGE_IMAGES[30],
    barrierRequired: 30,
    category: 'barrier',
    badge: '30% - 39%',
  },
  {
    id: 'marina_20',
    characterId: 'marina',
    title: 'Desarmada & Íntima',
    description:
      'Sem escudos nem meias verdades. Vulnerabilidade real, afeto transparente e medo confessado de perder você.',
    hint: 'Baixe as barreiras para 20% atingindo uma intimidade verdadeira e profunda.',
    imageSource: MARINA_STAGE_IMAGES[20],
    barrierRequired: 20,
    category: 'barrier',
    badge: '20% - 29%',
  },
  {
    id: 'marina_10',
    characterId: 'marina',
    title: 'Vínculo Puro & Entrega',
    description:
      'Vínculo verdadeiro, afeto incondicional e cumplicidade absoluta. As barreiras deixaram de existir.',
    hint: 'Baixe as barreiras para 10% ou menos conquistando a entrega total de Marina.',
    imageSource: MARINA_STAGE_IMAGES[10],
    barrierRequired: 10,
    category: 'special',
    badge: '0% - 19%',
  },
];

export function getCharacterGallery(characterId: string): GalleryPhoto[] {
  if (characterId === 'nova') {
    return NOVA_GALLERY;
  }
  if (characterId === 'marina' || characterId === 'helena') {
    return MARINA_GALLERY;
  }
  return [];
}
