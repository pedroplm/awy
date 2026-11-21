import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUsage } from '@/hooks/use-usage';
import { useChat } from '@/context/ChatContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenSaves?: () => void;
  onStartNewChat?: () => void;
}

export function UsageModal({
  visible,
  onClose,
  onOpenSaves,
  onStartNewChat,
}: Props) {
  const theme = useTheme();
  const { stats, resetStats, limits } = useUsage();
  const { isTextOnlyMode, setTextOnlyMode, activeCharacter } = useChat();

  const activeModel =
    process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-flash-lite-latest';

  const totalTokens = stats?.totalTokens || 0;
  const promptTokens = stats?.totalPromptTokens || 0;
  const candidateTokens = stats?.totalCandidateTokens || 0;
  const requestsToday = stats?.requestsToday || 0;
  const totalRequests = stats?.totalRequests || 0;
  const costUSD = stats?.estimatedCostUSD || 0;
  const costBRL = costUSD * 5.8; // Approximate conversion rate

  const remainingRequestsToday = Math.max(0, limits.requestsPerDay - requestsToday);
  const dailyPercentUsed = Math.min(100, (requestsToday / limits.requestsPerDay) * 100);

  const handleResetPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Deseja zerar os contadores de tokens e requisições para reiniciar seus testes?'
      );
      if (confirmed) {
        resetStats();
      }
    } else {
      Alert.alert(
        'Zerar Estatísticas',
        'Deseja zerar o contador de tokens e custo acumulados para reiniciar seus testes?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Zerar', style: 'destructive', onPress: resetStats },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.background, borderColor: theme.backgroundElement }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="settings-outline" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Configurações & Monitor
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Modelo: <Text style={{ fontWeight: '700', color: '#10B981' }}>{activeModel}</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Fechar modal">
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true} indicatorStyle="white">
            {/* Conversation & Save Management Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="chatbubbles-outline" size={16} color={activeCharacter.accentColor || '#6366F1'} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Opções da Conversa
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onOpenSaves?.();
                }}
                style={[styles.actionRowBtn, { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.actionRowIconWrap, { backgroundColor: (activeCharacter.accentColor || '#6366F1') + '20' }]}>
                  <Ionicons name="bookmark" size={18} color={activeCharacter.accentColor || '#6366F1'} />
                </View>
                <View style={styles.actionRowTextCol}>
                  <Text style={[styles.actionRowTitle, { color: theme.text }]}>
                    Saves & Linhas do Tempo
                  </Text>
                  <Text style={[styles.actionRowSubtitle, { color: theme.textSecondary }]}>
                    Gerenciar slots, alternar histórias e fazer backup em arquivo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onStartNewChat?.();
                }}
                style={[styles.actionRowBtn, { backgroundColor: theme.backgroundSelected, marginTop: 8 }]}>
                <View style={[styles.actionRowIconWrap, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="add-circle-outline" size={19} color="#10B981" />
                </View>
                <View style={styles.actionRowTextCol}>
                  <Text style={[styles.actionRowTitle, { color: theme.text }]}>
                    Começar Nova Conversa
                  </Text>
                  <Text style={[styles.actionRowSubtitle, { color: theme.textSecondary }]}>
                    Inicia uma nova linha do tempo com {activeCharacter.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Reading Mode / Text Only Preferences */}
            <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="eye-outline" size={16} color="#EC4899" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Preferências de Visualização
                </Text>
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceTextCol}>
                  <View style={styles.preferenceTitleLine}>
                    <Ionicons name="document-text-outline" size={16} color={theme.text} />
                    <Text style={[styles.preferenceTitle, { color: theme.text }]}>
                      Modo Texto
                    </Text>
                    {isTextOnlyMode && (
                      <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.statusBadgeText}>Ativo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.preferenceSubtitle, { color: theme.textSecondary }]}>
                    Oculta todas as imagens e retratos no chat, exibindo apenas as mensagens de texto (ideal para ler no ônibus ou economizar dados).
                  </Text>
                </View>

                <Switch
                  value={isTextOnlyMode}
                  onValueChange={setTextOnlyMode}
                  trackColor={{ false: theme.backgroundSelected, true: activeCharacter.accentColor || '#6366F1' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Tokens Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="stats-chart" size={16} color="#6366F1" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Tokens Consumidos
                </Text>
              </View>

              <View style={styles.highlightNumberBox}>
                <Text style={[styles.highlightNumber, { color: theme.text }]}>
                  {totalTokens.toLocaleString('pt-BR')}
                </Text>
                <Text style={[styles.highlightLabel, { color: theme.textSecondary }]}>
                  tokens totais acumulados nesta sessão
                </Text>
              </View>

              <View style={styles.tokenBreakdownRow}>
                <View style={[styles.tokenPill, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.tokenPillLabel, { color: theme.textSecondary }]}>
                    Entrada (Prompt):
                  </Text>
                  <Text style={[styles.tokenPillValue, { color: theme.text }]}>
                    {promptTokens.toLocaleString('pt-BR')}
                  </Text>
                </View>

                <View style={[styles.tokenPill, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.tokenPillLabel, { color: theme.textSecondary }]}>
                    Saída (Geração):
                  </Text>
                  <Text style={[styles.tokenPillValue, { color: theme.text }]}>
                    {candidateTokens.toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>

              {stats && stats.lastTimestamp > 0 && (
                <Text style={[styles.lastUsageText, { color: theme.textSecondary }]}>
                  Última resposta: +{stats.lastPromptTokens} entrada / +{stats.lastCandidateTokens} saída
                </Text>
              )}
            </View>

            {/* Cost Estimation Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="cash-outline" size={16} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Custo Estimado da API
                </Text>
              </View>

              <View style={styles.costRow}>
                <View style={styles.costBox}>
                  <Text style={[styles.costValue, { color: '#10B981' }]}>
                    ${costUSD.toFixed(5)}
                  </Text>
                  <Text style={[styles.costCurrency, { color: theme.textSecondary }]}>
                    USD
                  </Text>
                </View>

                <View style={styles.costDivider} />

                <View style={styles.costBox}>
                  <Text style={[styles.costValue, { color: theme.text }]}>
                    R$ {costBRL.toFixed(4)}
                  </Text>
                  <Text style={[styles.costCurrency, { color: theme.textSecondary }]}>
                    BRL (aprox)
                  </Text>
                </View>
              </View>

              <View style={[styles.freeTierBadge, { backgroundColor: '#10B98120', borderColor: '#10B98150' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.freeTierText}>
                  100% Gratuito no Free Tier do Google AI Studio (não é debitado do cartão)
                </Text>
              </View>
            </View>

            {/* Daily Limits & Quotas Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="speedometer-outline" size={16} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Limites do Free Tier (Gemini Flash-Lite)
                </Text>
              </View>

              <View style={styles.quotaHeader}>
                <Text style={[styles.quotaLabel, { color: theme.textSecondary }]}>
                  Requisições hoje:
                </Text>
                <Text style={[styles.quotaValue, { color: theme.text }]}>
                  <Text style={{ fontWeight: '800', color: '#F59E0B' }}>{requestsToday}</Text> / {limits.requestsPerDay.toLocaleString()} RPD
                </Text>
              </View>

              {/* Quota Progress Bar */}
              <View style={[styles.quotaTrack, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.quotaFill,
                    {
                      width: `${Math.max(1, dailyPercentUsed)}%`,
                      backgroundColor: dailyPercentUsed > 80 ? '#EF4444' : '#F59E0B',
                    },
                  ]}
                />
              </View>

              <View style={styles.quotaFooter}>
                <Text style={[styles.remainingText, { color: '#10B981' }]}>
                  ✓ Restam {remainingRequestsToday.toLocaleString('pt-BR')} requisições hoje
                </Text>
                <Text style={[styles.rateLimitText, { color: theme.textSecondary }]}>
                  Taxa máxima: {limits.requestsPerMinute} RPM (req/min)
                </Text>
              </View>

              <Text style={[styles.totalCallsText, { color: theme.textSecondary }]}>
                Total de chamadas feitas em todos os testes: {totalRequests}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={[styles.footer, { borderTopColor: theme.backgroundElement }]}>
            <TouchableOpacity
              onPress={handleResetPress}
              style={[styles.resetButton, { backgroundColor: theme.backgroundElement }]}
              activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              <Text style={styles.resetButtonText}>Zerar Contadores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.doneButton}
              activeOpacity={0.8}>
              <Text style={styles.doneButtonText}>Concluído</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.three,
  },
  sectionCard: {
    padding: Spacing.three,
    borderRadius: 14,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two + 2,
    borderRadius: 12,
    gap: Spacing.two,
  },
  actionRowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTextCol: {
    flex: 1,
    gap: 2,
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRowSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: 2,
  },
  preferenceTextCol: {
    flex: 1,
    gap: 4,
  },
  preferenceTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  preferenceSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  highlightNumberBox: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  highlightNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  highlightLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tokenBreakdownRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tokenPill: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: 10,
    alignItems: 'center',
  },
  tokenPillLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  tokenPillValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  lastUsageText: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.one,
  },
  costBox: {
    alignItems: 'center',
  },
  costValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  costCurrency: {
    fontSize: 11,
    marginTop: 1,
  },
  costDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  freeTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  freeTierText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 12,
  },
  quotaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  quotaTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    borderRadius: 4,
  },
  quotaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateLimitText: {
    fontSize: 11,
  },
  totalCallsText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
