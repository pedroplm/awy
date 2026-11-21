import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { MemoryCategory, MemoryEntry } from '@/types/rag';
import { Spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | MemoryCategory;

const CATEGORY_CONFIG: Record<
  MemoryCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  event: {
    label: 'Momentos & Cenas',
    icon: 'sparkles',
    color: '#8B5CF6',
  },
  user_fact: {
    label: 'Sobre Você',
    icon: 'person',
    color: '#3B82F6',
  },
  relationship: {
    label: 'Relação & Promessas',
    icon: 'heart',
    color: '#EC4899',
  },
  preference: {
    label: 'Gostos & Hábitos',
    icon: 'star',
    color: '#F59E0B',
  },
  character_lore: {
    label: 'História & Lore',
    icon: 'book',
    color: '#10B981',
  },
};

export function MemoryDiaryModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const {
    activeCharacter,
    memories,
    unsummarizedCount,
    addMemory,
    updateMemory,
    deleteMemory,
    summarizeRecentMessages,
  } = useChat();

  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('event');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('event');

  // Summarizing state
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Filtered and searched memories
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      if (selectedFilter !== 'all' && mem.category !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesContent = mem.content.toLowerCase().includes(query);
        const matchesCategory = CATEGORY_CONFIG[mem.category]?.label.toLowerCase().includes(query);
        const matchesKeywords = mem.keywords?.some((k) => k.toLowerCase().includes(query));
        return matchesContent || matchesCategory || matchesKeywords;
      }
      return true;
    });
  }, [memories, selectedFilter, searchQuery]);

  const handleSummarizeNow = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await summarizeRecentMessages(true);
      Alert.alert(
        res.addedCount > 0 ? '✨ Memórias Gravadas!' : 'Diário Atualizado',
        res.message
      );
    } catch (err) {
      console.warn('Erro ao resumir conversa:', err);
      Alert.alert('Erro', 'Não foi possível resumir a conversa recente.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveNew = async () => {
    if (!newContent.trim()) {
      Alert.alert('Campo Vazio', 'Digite a lembrança antes de salvar.');
      return;
    }
    try {
      await addMemory(newContent.trim(), newCategory);
      setNewContent('');
      setIsCreating(false);
    } catch (err) {
      console.warn('Erro ao salvar memória:', err);
      Alert.alert('Erro', 'Não foi possível gravar a lembrança.');
    }
  };

  const handleStartEdit = (mem: MemoryEntry) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditCategory(mem.category);
  };

  const handleSaveEdit = async (memId: string) => {
    if (!editContent.trim()) {
      Alert.alert('Campo Vazio', 'A lembrança não pode ficar vazia.');
      return;
    }
    try {
      await updateMemory(memId, {
        content: editContent.trim(),
        category: editCategory,
      });
      setEditingId(null);
    } catch (err) {
      console.warn('Erro ao atualizar memória:', err);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const handleDelete = (mem: MemoryEntry) => {
    const doDelete = async () => {
      try {
        await deleteMemory(mem.id);
      } catch (err) {
        console.warn('Erro ao excluir memória:', err);
        Alert.alert('Erro', 'Não foi possível excluir a lembrança.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja excluir esta lembrança do diário da personagem?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Excluir Lembrança',
        'Tem certeza que deseja apagar esta memória? A personagem não irá mais se lembrar disto.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const getSourceBadge = (source: MemoryEntry['source']) => {
    switch (source) {
      case 'summary':
        return { label: '⚡ Auto-resumo', color: '#10B981' };
      case 'manual':
        return { label: '✍️ Manual', color: '#6366F1' };
      case 'auto_extracted':
        return { label: '🔍 Detectado', color: '#F59E0B' };
      case 'user_lore':
      case 'pre_seeded':
      default:
        return { label: '📜 Fundo/Lore', color: '#8B5CF6' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
            <View style={styles.headerInfo}>
              <View style={styles.characterAvatarWrap}>
                {activeCharacter.avatarImage ? (
                  <Image
                    source={activeCharacter.avatarImage}
                    style={styles.characterAvatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.characterAvatarEmoji}>{activeCharacter.avatar}</Text>
                )}
              </View>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Caderno de Lembranças
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: activeCharacter.accentColor + '25' }]}>
                    <Text style={[styles.countBadgeText, { color: activeCharacter.accentColor }]}>
                      {memories.length}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Tudo o que {activeCharacter.name} sabe e guarda sobre você
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions Row: Auto-summarize & Add manual */}
          <View style={[styles.actionsRow, { borderBottomColor: theme.backgroundSelected }]}>
            <TouchableOpacity
              onPress={handleSummarizeNow}
              disabled={isSummarizing}
              style={[
                styles.summarizeBtn,
                { backgroundColor: theme.backgroundSelected },
              ]}>
              {isSummarizing ? (
                <ActivityIndicator size="small" color={activeCharacter.accentColor} />
              ) : (
                <MaterialCommunityIcons
                  name="brain"
                  size={16}
                  color={activeCharacter.accentColor}
                />
              )}
              <Text style={[styles.actionBtnText, { color: theme.text }]}>
                {isSummarizing ? 'Analisando conversa...' : 'Resumir conversa recente'}
              </Text>
              {unsummarizedCount > 0 && !isSummarizing && (
                <View style={styles.unsumBadge}>
                  <Text style={styles.unsumBadgeText}>{unsummarizedCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsCreating(!isCreating);
                setEditingId(null);
              }}
              style={[
                styles.addBtn,
                { backgroundColor: activeCharacter.accentColor },
              ]}>
              <Ionicons name={isCreating ? 'close' : 'add'} size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isCreating ? 'Cancelar' : 'Nova Lembrança'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form to Create New Memory */}
          {isCreating && (
            <View style={[styles.createCard, { backgroundColor: theme.background, borderColor: activeCharacter.accentColor }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                ✍️ Adicionar Lembrança Manualmente
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
                placeholder={`Ex: Vocês viram estrelas na colina, ou você revelou que adora tocar violão.`}
                placeholderTextColor={theme.textSecondary}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.categoryPickerLabel, { color: theme.textSecondary }]}>
                Categoria:
              </Text>
              <View style={styles.categoryPillsRow}>
                {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const isSelected = newCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={[
                        styles.catPill,
                        isSelected
                          ? { backgroundColor: cfg.color, borderColor: cfg.color }
                          : { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                      ]}>
                      <Ionicons
                        name={cfg.icon}
                        size={12}
                        color={isSelected ? '#FFFFFF' : cfg.color}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                        ]}>
                        {cfg.label.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formButtonsRow}>
                <TouchableOpacity
                  onPress={() => setIsCreating(false)}
                  style={[styles.formCancelBtn, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.formCancelBtnText, { color: theme.textSecondary }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveNew}
                  style={[styles.formSaveBtn, { backgroundColor: activeCharacter.accentColor }]}>
                  <Text style={styles.formSaveBtnText}>Salvar Lembrança</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Search bar & Filter Pills */}
          <View style={styles.filtersSection}>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
              ]}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar lembranças ou palavras-chave..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}>
              <TouchableOpacity
                onPress={() => setSelectedFilter('all')}
                style={[
                  styles.filterChip,
                  selectedFilter === 'all'
                    ? { backgroundColor: activeCharacter.accentColor, borderColor: activeCharacter.accentColor }
                    : { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedFilter === 'all' ? '#FFFFFF' : theme.textSecondary },
                  ]}>
                  Todas ({memories.length})
                </Text>
              </TouchableOpacity>

              {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isSelected = selectedFilter === cat;
                const count = memories.filter((m) => m.category === cat).length;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedFilter(cat)}
                    style={[
                      styles.filterChip,
                      isSelected
                        ? { backgroundColor: cfg.color, borderColor: cfg.color }
                        : { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                    ]}>
                    <Ionicons
                      name={cfg.icon}
                      size={12}
                      color={isSelected ? '#FFFFFF' : cfg.color}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                      ]}>
                      {cfg.label.split(' ')[0]} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Memories List */}
          <ScrollView
            style={styles.memoriesList}
            contentContainerStyle={styles.memoriesListContent}
            keyboardShouldPersistTaps="handled">
            {filteredMemories.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="book-open-blank-variant"
                  size={42}
                  color={theme.textSecondary}
                  style={{ opacity: 0.5, marginBottom: Spacing.two }}
                />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {searchQuery ? 'Nenhuma lembrança encontrada' : 'Nenhuma lembrança gravada ainda'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {searchQuery
                    ? 'Tente buscar por outras palavras.'
                    : `Converse com ${activeCharacter.name} ou clique em "Resumir conversa" para salvar eventos no diário.`}
                </Text>
              </View>
            ) : (
              filteredMemories.map((mem) => {
                const isEditing = editingId === mem.id;
                const catCfg = CATEGORY_CONFIG[mem.category] || CATEGORY_CONFIG.event;
                const srcBadge = getSourceBadge(mem.source);

                if (isEditing) {
                  return (
                    <View
                      key={mem.id}
                      style={[
                        styles.editCard,
                        { backgroundColor: theme.background, borderColor: catCfg.color },
                      ]}>
                      <Text style={[styles.editCardTitle, { color: theme.text }]}>
                        Editar Lembrança
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                        ]}
                        value={editContent}
                        onChangeText={setEditContent}
                        multiline
                        numberOfLines={3}
                      />

                      <View style={styles.categoryPillsRow}>
                        {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
                          const cfg = CATEGORY_CONFIG[cat];
                          const isSelected = editCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setEditCategory(cat)}
                              style={[
                                styles.catPill,
                                isSelected
                                  ? { backgroundColor: cfg.color, borderColor: cfg.color }
                                  : { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                              ]}>
                              <Ionicons
                                name={cfg.icon}
                                size={12}
                                color={isSelected ? '#FFFFFF' : cfg.color}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={[
                                  styles.catPillText,
                                  { color: isSelected ? '#FFFFFF' : theme.text },
                                ]}>
                                {cfg.label.split(' ')[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.formButtonsRow}>
                        <TouchableOpacity
                          onPress={() => setEditingId(null)}
                          style={[styles.formCancelBtn, { backgroundColor: theme.backgroundElement }]}>
                          <Text style={[styles.formCancelBtnText, { color: theme.textSecondary }]}>
                            Cancelar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleSaveEdit(mem.id)}
                          style={[styles.formSaveBtn, { backgroundColor: activeCharacter.accentColor }]}>
                          <Text style={styles.formSaveBtnText}>Salvar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View
                    key={mem.id}
                    style={[
                      styles.memoryCard,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardBadges}>
                        <View
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: catCfg.color + '20', borderColor: catCfg.color + '40' },
                          ]}>
                          <Ionicons name={catCfg.icon} size={11} color={catCfg.color} />
                          <Text style={[styles.categoryBadgeText, { color: catCfg.color }]}>
                            {catCfg.label}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.sourceBadge,
                            { backgroundColor: srcBadge.color + '15' },
                          ]}>
                          <Text style={[styles.sourceBadgeText, { color: srcBadge.color }]}>
                            {srcBadge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleStartEdit(mem)}
                          style={[styles.cardActionBtn, { backgroundColor: theme.backgroundElement }]}
                          accessibilityLabel="Editar lembrança">
                          <Ionicons name="pencil" size={13} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDelete(mem)}
                          style={[styles.cardActionBtn, { backgroundColor: theme.backgroundElement }]}
                          accessibilityLabel="Excluir lembrança">
                          <Ionicons name="trash-outline" size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.cardContent, { color: theme.text }]}>
                      {mem.content}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                        {new Date(mem.timestamp).toLocaleDateString('pt-BR')} • {new Date(mem.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {mem.keywords && mem.keywords.length > 0 && (
                        <View style={styles.keywordsWrap}>
                          {mem.keywords.slice(0, 3).map((kw, i) => (
                            <Text key={i} style={[styles.keywordText, { color: theme.textSecondary }]}>
                              #{kw}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two + 2,
  },
  characterAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  characterAvatarImg: {
    width: 44,
    height: 44,
  },
  characterAvatarEmoji: {
    fontSize: 22,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summarizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 7,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unsumBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  unsumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  createCard: {
    margin: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.two,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 64,
  },
  categoryPickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: 4,
  },
  formCancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  formCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formSaveBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  formSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filtersSection: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two + 2,
    gap: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 38,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterChipsRow: {
    gap: 6,
    paddingBottom: Spacing.two,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memoriesList: {
    flex: 1,
  },
  memoriesListContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two + 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five * 2,
    paddingHorizontal: Spacing.four,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  memoryCard: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  cardActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  cardDate: {
    fontSize: 10,
  },
  keywordsWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  keywordText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  editCard: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.two,
  },
  editCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
});
