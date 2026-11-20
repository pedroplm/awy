import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { SaveSlotMeta } from '@/types/save';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SaveSlotsModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const {
    activeCharacter,
    saveSlots,
    activeSaveSlotId,
    createSaveSlot,
    loadSaveSlot,
    startNewConversation,
    deleteSaveSlot,
    renameSaveSlot,
    exportSaveSlot,
    importSaveSlot,
  } = useChat();

  const [isCreating, setIsCreating] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      await createSaveSlot(newSlotName);
      setNewSlotName('');
      setIsCreating(false);
    } catch (err) {
      console.warn('Erro ao criar save:', err);
      Alert.alert('Erro', 'Não foi possível criar o save.');
    }
  };

  const handleRename = async (slotId: string) => {
    if (!editingName.trim()) {
      setEditingSlotId(null);
      return;
    }
    try {
      await renameSaveSlot(slotId, editingName.trim());
      setEditingSlotId(null);
      setEditingName('');
    } catch (err) {
      console.warn('Erro ao renomear save:', err);
      Alert.alert('Erro', 'Não foi possível renomear o save.');
    }
  };

  const handleLoad = (slot: SaveSlotMeta) => {
    if (slot.id === activeSaveSlotId) {
      onClose();
      return;
    }

    const confirmLoad = () => {
      loadSaveSlot(slot.id)
        .then(() => onClose())
        .catch((err) => {
          console.warn('Erro ao carregar save:', err);
          Alert.alert('Erro', 'Não foi possível carregar este save.');
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja carregar o save "${slot.name}"? O estado atual está salvo.`)) {
        confirmLoad();
      }
    } else {
      Alert.alert(
        'Carregar Save',
        `Deseja carregar "${slot.name}"? Seu progresso do momento continua salvo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Carregar', onPress: confirmLoad },
        ]
      );
    }
  };

  const handleStartNew = () => {
    const confirmStart = () => {
      startNewConversation()
        .then(() => onClose())
        .catch((err) => {
          console.warn('Erro ao iniciar nova conversa:', err);
          Alert.alert('Erro', 'Não foi possível iniciar uma nova conversa.');
        });
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `Deseja iniciar uma nova conversa com ${activeCharacter.name}? Seu progresso atual já está salvo com segurança e você poderá voltar a ele quando quiser!`
        )
      ) {
        confirmStart();
      }
    } else {
      Alert.alert(
        'Começar Nova Conversa',
        `Deseja iniciar uma conversa do zero com ${activeCharacter.name}?\n\nFique tranquilo: seu progresso atual está protegido e salvo em um slot. Você pode voltar a ele a qualquer momento!`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Começar do Zero', onPress: confirmStart },
        ]
      );
    }
  };

  const handleDelete = (slot: SaveSlotMeta) => {
    if (saveSlots.length <= 1) {
      Alert.alert(
        'Atenção',
        'Este é o único save desta personagem. Para começar de novo sem apagar, use "Começar Nova Conversa".'
      );
      return;
    }

    const confirmDelete = () => {
      deleteSaveSlot(slot.id).catch((err) => {
        console.warn('Erro ao excluir save:', err);
        Alert.alert('Erro', 'Não foi possível excluir o save.');
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja excluir o save "${slot.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Excluir Save',
        `Tem certeza que deseja excluir o save "${slot.name}"? Esta ação não pode ser desfeita.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleExportFile = async (slotId: string, slotName: string) => {
    try {
      const json = await exportSaveSlot(slotId);
      const safeName = slotName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const filename = `backup_${activeCharacter.id}_${safeName}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Download Concluído', `Arquivo ${filename} baixado com sucesso!`);
        return;
      }

      // Native: Write actual file to cache directory without memory limits
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: `Salvar Backup de ${activeCharacter.name}`,
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Salvo no dispositivo', `Arquivo salvo em: ${fileUri}`);
      }
    } catch (err: any) {
      console.warn('Erro ao exportar arquivo:', err);
      Alert.alert('Erro na Exportação', err?.message || 'Não foi possível gerar o arquivo de backup.');
    }
  };

  const handleCopyJson = async (slotId: string, slotName: string) => {
    try {
      const json = await exportSaveSlot(slotId);
      await Clipboard.setStringAsync(json);
      Alert.alert(
        'Backup Copiado! 📋',
        `O texto do save "${slotName}" foi copiado para a área de transferência.\n(Dica: Para backups longos, recomendamos usar o botão de Arquivo para não cortar mensagens!)`
      );
    } catch (err) {
      console.warn('Erro ao copiar save:', err);
      Alert.alert('Erro', 'Não foi possível copiar o save.');
    }
  };

  const handleImportFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const file = res.assets[0];
      let jsonContent = '';

      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        jsonContent = await response.text();
      } else {
        jsonContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const imported = await importSaveSlot(jsonContent);
      Alert.alert(
        'Save Restaurado! 🎉',
        `O save "${imported.name}" foi restaurado com sucesso!\n(${imported.messageCount} mensagens e ${imported.memoryCount} memórias carregadas)`
      );
    } catch (err: any) {
      console.warn('Erro ao importar arquivo:', err);
      Alert.alert(
        'Erro ao Importar',
        err?.message || 'O arquivo selecionado não é um backup válido.'
      );
    }
  };

  const handleImportText = async () => {
    if (!importJsonText.trim()) return;
    try {
      const imported = await importSaveSlot(importJsonText.trim());
      setImportJsonText('');
      setIsImporting(false);
      Alert.alert('Sucesso! 🎉', `Save "${imported.name}" importado com sucesso!`);
    } catch (err: any) {
      Alert.alert('Erro ao Importar', err?.message || 'JSON inválido ou corrompido.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.background, borderColor: theme.backgroundElement },
          ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.backgroundElement },
                ]}>
                <Ionicons name="bookmark" size={20} color={activeCharacter.accentColor} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Saves & Linhas do Tempo
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {activeCharacter.name} • {saveSlots.length}{' '}
                  {saveSlots.length === 1 ? 'save registrado' : 'saves registrados'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Fechar modal">
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator
            indicatorStyle="white"
            keyboardShouldPersistTaps="handled">
            {/* Top Quick Actions */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: activeCharacter.accentColor }]}
                onPress={() => {
                  setNewSlotName(
                    `Save ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  );
                  setIsCreating(true);
                }}
                activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={18} color="#000" />
                <Text style={styles.primaryActionText}>Criar Save Atual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={handleStartNew}
                activeOpacity={0.8}>
                <Ionicons name="refresh-outline" size={17} color={theme.text} />
                <Text style={[styles.secondaryActionText, { color: theme.text }]}>
                  Começar do Zero
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Save Slot Input Form */}
            {isCreating && (
              <View style={[styles.inlineFormCard, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.inlineFormTitle, { color: theme.text }]}>
                  Nome do novo Save:
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.backgroundSelected,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={newSlotName}
                  onChangeText={setNewSlotName}
                  placeholder="Ex: Pós Colina / Teste RAG 1"
                  placeholderTextColor={theme.textSecondary}
                  autoFocus
                />
                <View style={styles.inlineFormButtons}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={() => setIsCreating(false)}>
                    <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: activeCharacter.accentColor }]}
                    onPress={handleCreate}>
                    <Text style={styles.confirmBtnText}>Salvar Snapshot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Import JSON Form */}
            {isImporting && (
              <View style={[styles.inlineFormCard, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.inlineFormTitle, { color: theme.text }]}>
                  Cole o JSON de backup:
                </Text>
                <TextInput
                  style={[
                    styles.textInputArea,
                    {
                      backgroundColor: theme.backgroundSelected,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={importJsonText}
                  onChangeText={setImportJsonText}
                  placeholder='Cole o conteúdo do arquivo JSON aqui...'
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.inlineFormButtons}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={async () => {
                      try {
                        const clip = await Clipboard.getStringAsync();
                        if (clip && clip.trim()) {
                          setImportJsonText(clip.trim());
                        } else {
                          Alert.alert('Área de Transferência Vazia', 'Nenhum texto encontrado para colar.');
                        }
                      } catch {
                        Alert.alert('Erro', 'Não foi possível ler a área de transferência.');
                      }
                    }}>
                    <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                      📋 Colar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={() => setIsImporting(false)}>
                    <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: '#10B981' }]}
                    onPress={handleImportText}>
                    <Text style={styles.confirmBtnText}>Restaurar Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Export Viewer Modal Overlay */}
            {exportedJson && (
              <View style={[styles.inlineFormCard, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.exportHeaderRow}>
                  <Text style={[styles.inlineFormTitle, { color: theme.text }]}>
                    Backup Exportado (JSON):
                  </Text>
                  <TouchableOpacity onPress={() => setExportedJson(null)}>
                    <Ionicons name="close" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[
                    styles.textInputArea,
                    {
                      backgroundColor: theme.backgroundSelected,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={exportedJson}
                  editable={false}
                  selectTextOnFocus
                  multiline
                  numberOfLines={6}
                />
                <Text style={[styles.exportHint, { color: theme.textSecondary }]}>
                  💡 Dica: Toque duas vezes no texto acima para selecionar e copiar todo o backup!
                </Text>
                <TouchableOpacity
                  style={[styles.shareActionBtn, { backgroundColor: '#38BDF8', marginTop: 10 }]}
                  onPress={async () => {
                    const targetSlot = saveSlots.find((s) => s.id === activeSaveSlotId) || saveSlots[0];
                    if (targetSlot) {
                      await handleExportFile(targetSlot.id, targetSlot.name);
                    }
                  }}>
                  <Ionicons name="download-outline" size={15} color="#000" />
                  <Text style={[styles.shareActionBtnText, { color: '#000', fontWeight: '700' }]}>
                    Salvar Arquivo (.json) no Celular
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Saves List */}
            <View style={styles.slotsContainer}>
              <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
                LINHAS DO TEMPO DISPONÍVEIS
              </Text>

              {saveSlots.map((slot) => {
                const isActive = slot.id === activeSaveSlotId;
                const isEditing = editingSlotId === slot.id;
                const formattedDate = new Date(slot.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View
                    key={slot.id}
                    style={[
                      styles.slotCard,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: isActive ? activeCharacter.accentColor : 'transparent',
                        borderWidth: isActive ? 1.5 : 0,
                      },
                    ]}>
                    {/* Slot Header */}
                    <View style={styles.slotHeaderRow}>
                      <View style={{ flex: 1 }}>
                        {isEditing ? (
                          <View style={styles.editRow}>
                            <TextInput
                              style={[
                                styles.editInput,
                                {
                                  backgroundColor: theme.backgroundSelected,
                                  color: theme.text,
                                },
                              ]}
                              value={editingName}
                              onChangeText={setEditingName}
                              autoFocus
                            />
                            <TouchableOpacity
                              onPress={() => handleRename(slot.id)}
                              style={[styles.iconSmallBtn, { backgroundColor: '#10B981' }]}>
                              <Ionicons name="checkmark" size={14} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setEditingSlotId(null)}
                              style={[
                                styles.iconSmallBtn,
                                { backgroundColor: theme.backgroundSelected },
                              ]}>
                              <Ionicons name="close" size={14} color={theme.text} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.nameWithBadge}>
                            <Text style={[styles.slotName, { color: theme.text }]}>
                              {slot.name}
                            </Text>
                            {isActive && (
                              <View
                                style={[
                                  styles.activeBadge,
                                  { backgroundColor: activeCharacter.accentColor },
                                ]}>
                                <Text style={styles.activeBadgeText}>Ativo</Text>
                              </View>
                            )}
                          </View>
                        )}
                        <Text style={[styles.slotDate, { color: theme.textSecondary }]}>
                          Atualizado: {formattedDate}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.slotStatsRow}>
                      <View
                        style={[
                          styles.statPill,
                          { backgroundColor: theme.backgroundSelected },
                        ]}>
                        <Ionicons name="chatbubbles-outline" size={12} color="#60A5FA" />
                        <Text style={[styles.statPillText, { color: theme.text }]}>
                          {slot.messageCount} msgs
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statPill,
                          { backgroundColor: theme.backgroundSelected },
                        ]}>
                        <Ionicons name="sparkles-outline" size={12} color="#F59E0B" />
                        <Text style={[styles.statPillText, { color: theme.text }]}>
                          {slot.memoryCount} memórias
                        </Text>
                      </View>

                      {slot.barrier !== null && (
                        <View
                          style={[
                            styles.statPill,
                            { backgroundColor: theme.backgroundSelected },
                          ]}>
                          <Ionicons name="shield-outline" size={12} color="#EC4899" />
                          <Text style={[styles.statPillText, { color: theme.text }]}>
                            {slot.barrier}% defesas
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Last Message Preview */}
                    {slot.lastMessagePreview ? (
                      <View
                        style={[
                          styles.previewBox,
                          { backgroundColor: theme.backgroundSelected },
                        ]}>
                        <Text
                          style={[styles.previewText, { color: theme.textSecondary }]}
                          numberOfLines={2}>
                          {`"${slot.lastMessagePreview}"`}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Buttons for this Slot */}
                    <View style={styles.slotActionsRow}>
                      {isActive ? (
                        <View style={styles.inUsePill}>
                          <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                          <Text style={styles.inUseText}>Conversa em Andamento</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.loadBtn,
                            { backgroundColor: activeCharacter.accentColor },
                          ]}
                          onPress={() => handleLoad(slot)}
                          activeOpacity={0.8}>
                          <Ionicons name="play" size={13} color="#000" />
                          <Text style={styles.loadBtnText}>Carregar Save</Text>
                        </TouchableOpacity>
                      )}

                      <View style={styles.slotUtilityButtons}>
                        <TouchableOpacity
                          onPress={() => handleExportFile(slot.id, slot.name)}
                          style={[
                            styles.utilityBtn,
                            { backgroundColor: theme.backgroundSelected },
                          ]}
                          accessibilityLabel="Exportar arquivo .json">
                          <Ionicons name="download-outline" size={16} color="#38BDF8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleCopyJson(slot.id, slot.name)}
                          style={[
                            styles.utilityBtn,
                            { backgroundColor: theme.backgroundSelected },
                          ]}
                          accessibilityLabel="Copiar JSON do save diretamente">
                          <Ionicons name="copy-outline" size={14} color="#10B981" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setEditingSlotId(slot.id);
                            setEditingName(slot.name);
                          }}
                          style={[
                            styles.utilityBtn,
                            { backgroundColor: theme.backgroundSelected },
                          ]}
                          accessibilityLabel="Renomear save">
                          <Ionicons name="pencil" size={14} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDelete(slot)}
                          style={[
                            styles.utilityBtn,
                            { backgroundColor: theme.backgroundSelected },
                          ]}
                          accessibilityLabel="Excluir save">
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom Tools */}
            <View style={styles.bottomImportBox}>
              <TouchableOpacity
                style={[
                  styles.importFileBtn,
                  {
                    backgroundColor: theme.backgroundSelected,
                    borderColor: theme.backgroundElement,
                  },
                ]}
                onPress={handleImportFile}
                activeOpacity={0.8}>
                <Ionicons name="folder-open-outline" size={17} color="#38BDF8" />
                <Text style={[styles.importFileBtnText, { color: theme.text }]}>
                  Restaurar via Arquivo (.json)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.importTriggerBtn}
                onPress={() => setIsImporting(!isImporting)}>
                <Ionicons name="clipboard-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.importTriggerText, { color: theme.textSecondary }]}>
                  {isImporting ? 'Ocultar importação manual' : 'Ou colar texto JSON manualmente'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 18,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryActionText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inlineFormCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  inlineFormTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  textInputArea: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    borderWidth: 1,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  inlineFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  exportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exportHint: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  slotsContainer: {
    marginBottom: 16,
  },
  slotCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  slotName: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  slotDate: {
    fontSize: 11,
    marginTop: 3,
  },
  slotStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  slotActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inUsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inUseText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  loadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  loadBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  slotUtilityButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  utilityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 13,
  },
  iconSmallBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomImportBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  importFileBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  importFileBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  importTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  importTriggerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  shareActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
