import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { GalleryPhoto } from '@/types/gallery';
import { getCharacterGallery } from '@/constants/gallery';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  character: Character;
}

type FilterTab = 'all' | 'unlocked' | 'locked';

export function GalleryModal({ visible, onClose, character }: Props) {
  const theme = useTheme();
  const { unlockedPhotoIds } = useChat();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [hintPhoto, setHintPhoto] = useState<GalleryPhoto | null>(null);

  const fullGallery = useMemo(() => {
    return getCharacterGallery(character.id);
  }, [character.id]);

  const unlockedCount = useMemo(() => {
    return fullGallery.filter((p) => unlockedPhotoIds.includes(p.id)).length;
  }, [fullGallery, unlockedPhotoIds]);

  const totalCount = fullGallery.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredPhotos = useMemo(() => {
    return fullGallery.filter((photo) => {
      const isUnlocked = unlockedPhotoIds.includes(photo.id);
      if (filterTab === 'unlocked') return isUnlocked;
      if (filterTab === 'locked') return !isUnlocked;
      return true;
    });
  }, [fullGallery, unlockedPhotoIds, filterTab]);

  const handlePhotoPress = (photo: GalleryPhoto) => {
    const isUnlocked = unlockedPhotoIds.includes(photo.id);
    if (isUnlocked) {
      setSelectedPhoto(photo);
    } else {
      setHintPhoto(photo);
    }
  };

  const renderPhotoCard = ({ item }: { item: GalleryPhoto }) => {
    const isUnlocked = unlockedPhotoIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePhotoPress(item)}
        style={[
          styles.photoCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isUnlocked ? (character.accentColor || '#F59E0B') + '40' : theme.backgroundSelected,
          },
        ]}>
        {isUnlocked ? (
          // UNLOCKED: Sharp, full-color image with title & details
          <View style={styles.cardInner}>
            <Image
              source={item.imageSource}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />
            {/* Scrim Overlay */}
            <View style={styles.scrimOverlay} />

            {/* Badge */}
            {item.badge && (
              <View
                style={[
                  styles.cardBadge,
                  { backgroundColor: (character.accentColor || '#F59E0B') + 'E6' },
                ]}>
                <Text style={styles.cardBadgeText}>{item.badge}</Text>
              </View>
            )}

            {/* Title & Info */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.cardFooterRow}>
                <Ionicons name="eye-outline" size={12} color="#E2E8F0" />
                <Text style={styles.cardSubtitle}>Ver em tela cheia</Text>
              </View>
            </View>
          </View>
        ) : (
          // LOCKED: Blurred / Darkened Silhouette with Padlock and Hint indicator
          <View style={styles.cardInner}>
            <Image
              source={item.imageSource}
              style={styles.cardImage}
              contentFit="cover"
              blurRadius={Platform.OS === 'android' ? 18 : 24}
              transition={200}
            />
            {/* Dark Frosted Overlay */}
            <View style={styles.lockedOverlay}>
              <View
                style={[
                  styles.lockIconCircle,
                  { backgroundColor: (character.accentColor || '#F59E0B') + '25', borderColor: (character.accentColor || '#F59E0B') + '60' },
                ]}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={character.accentColor || '#F59E0B'}
                />
              </View>

              <Text style={styles.lockedMysteryTitle}>Bloqueado</Text>
              <View style={styles.hintPromptPill}>
                <Ionicons name="help-circle-outline" size={11} color="#CBD5E1" />
                <Text style={styles.hintPromptText}>Toque para ver dica</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" />

        {/* Modal Top Header */}
        <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
          <View style={styles.headerTitleCol}>
            <View style={styles.headerBadgeRow}>
              <View
                style={[
                  styles.headerDot,
                  { backgroundColor: character.accentColor || '#F59E0B' },
                ]}
              />
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {character.name}
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Álbum de Memórias
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Fechar galeria">
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Progress & Milestone Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.overviewTopRow}>
            <View style={styles.overviewTextCol}>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                PROGRESSO DO ÁLBUM
              </Text>
              <Text style={[styles.overviewStats, { color: theme.text }]}>
                {unlockedCount} de {totalCount} momentos desbloqueados
              </Text>
            </View>
            <View
              style={[
                styles.percentBadge,
                { backgroundColor: (character.accentColor || '#F59E0B') + '25' },
              ]}>
              <Ionicons
                name="images"
                size={14}
                color={character.accentColor || '#F59E0B'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.percentBadgeText,
                  { color: character.accentColor || '#F59E0B' },
                ]}>
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Progress Bar Track */}
          <View style={[styles.progressBarTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: character.accentColor || '#F59E0B',
                },
              ]}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterTab('all')}
            style={[
              styles.filterTab,
              filterTab === 'all'
                ? { backgroundColor: character.accentColor || '#F59E0B' }
                : { backgroundColor: theme.backgroundElement },
            ]}>
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'all'
                  ? { color: '#FFFFFF', fontWeight: '700' }
                  : { color: theme.textSecondary },
              ]}>
              Todas ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterTab('unlocked')}
            style={[
              styles.filterTab,
              filterTab === 'unlocked'
                ? { backgroundColor: character.accentColor || '#F59E0B' }
                : { backgroundColor: theme.backgroundElement },
            ]}>
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'unlocked'
                  ? { color: '#FFFFFF', fontWeight: '700' }
                  : { color: theme.textSecondary },
              ]}>
              Desbloqueadas ({unlockedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterTab('locked')}
            style={[
              styles.filterTab,
              filterTab === 'locked'
                ? { backgroundColor: character.accentColor || '#F59E0B' }
                : { backgroundColor: theme.backgroundElement },
            ]}>
            <Text
              style={[
                styles.filterTabText,
                filterTab === 'locked'
                  ? { color: '#FFFFFF', fontWeight: '700' }
                  : { color: theme.textSecondary },
              ]}>
              Bloqueadas ({totalCount - unlockedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={44} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Nenhuma foto encontrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {filterTab === 'unlocked'
                ? 'Converse com ' + character.name + ' para desbloquear momentos especiais!'
                : 'Você já desbloqueou todas as fotos deste álbum!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPhotos}
            keyExtractor={(item) => item.id}
            renderItem={renderPhotoCard}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* LOCKED PHOTO HINT MODAL */}
        {hintPhoto && (
          <Modal
            visible={Boolean(hintPhoto)}
            transparent
            animationType="fade"
            onRequestClose={() => setHintPhoto(null)}>
            <View style={styles.hintModalOverlay}>
              <TouchableOpacity
                style={styles.hintDismissBackdrop}
                activeOpacity={1}
                onPress={() => setHintPhoto(null)}
              />
              <View
                style={[
                  styles.hintCard,
                  { backgroundColor: theme.background, borderColor: theme.backgroundElement },
                ]}>
                {/* Silhouette preview */}
                <View style={styles.hintPreviewWrap}>
                  <Image
                    source={hintPhoto.imageSource}
                    style={styles.hintPreviewImage}
                    contentFit="cover"
                    blurRadius={Platform.OS === 'android' ? 22 : 30}
                  />
                  <View style={styles.hintPreviewOverlay}>
                    <View
                      style={[
                        styles.hintLockBadge,
                        { backgroundColor: (character.accentColor || '#F59E0B') },
                      ]}>
                      <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.hintContentCol}>
                  <Text style={[styles.hintCardTag, { color: character.accentColor || '#F59E0B' }]}>
                    MOMENTO OCULTO
                  </Text>
                  <Text style={[styles.hintCardTitle, { color: theme.text }]}>
                    {hintPhoto.title}
                  </Text>

                  <View
                    style={[
                      styles.hintRequirementBox,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: (character.accentColor || '#F59E0B') + '40',
                      },
                    ]}>
                    <View style={styles.hintIconLine}>
                      <Ionicons
                        name="sparkles"
                        size={16}
                        color={character.accentColor || '#F59E0B'}
                      />
                      <Text
                        style={[
                          styles.hintRequirementHeader,
                          { color: character.accentColor || '#F59E0B' },
                        ]}>
                        Como Desbloquear:
                      </Text>
                    </View>
                    <Text style={[styles.hintRequirementText, { color: theme.text }]}>
                      {hintPhoto.hint}
                    </Text>
                  </View>

                  <Text style={[styles.hintExplorationTip, { color: theme.textSecondary }]}>
                    Experimente conduzir a conversa em torno desse assunto ou aprofunde a confiança mútua para vivenciar esta cena com {character.name}.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setHintPhoto(null)}
                    style={[
                      styles.hintActionButton,
                      { backgroundColor: character.accentColor || '#F59E0B' },
                    ]}>
                    <Text style={styles.hintActionBtnText}>Entendido, vou tentar!</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* FULLSCREEN LIGHTBOX VIEWER MODAL */}
        {selectedPhoto && (
          <Modal
            visible={Boolean(selectedPhoto)}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedPhoto(null)}>
            <View style={styles.lightboxContainer}>
              <StatusBar hidden={false} barStyle="light-content" />

              {/* Lightbox Top Bar */}
              <View style={styles.lightboxTopBar}>
                <TouchableOpacity
                  onPress={() => setSelectedPhoto(null)}
                  style={styles.lightboxCloseBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.lightboxTitleCol}>
                  <Text style={styles.lightboxTopTitle} numberOfLines={1}>
                    {selectedPhoto.title}
                  </Text>
                  <Text style={styles.lightboxTopChar}>
                    {character.name} • Memória Desbloqueada
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedPhoto(null)}
                  style={styles.lightboxCloseBtn}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Lightbox Main Image */}
              <View style={styles.lightboxImageWrapper}>
                <Image
                  source={selectedPhoto.imageSource}
                  style={styles.lightboxImage}
                  contentFit="contain"
                />
              </View>

              {/* Lightbox Bottom Narrative Sheet */}
              <View style={styles.lightboxBottomCard}>
                <View style={styles.lightboxBottomHeader}>
                  <View style={{ flex: 1 }}>
                    {selectedPhoto.badge && (
                      <View
                        style={[
                          styles.lightboxBadge,
                          { backgroundColor: (character.accentColor || '#F59E0B') + '30' },
                        ]}>
                        <Text
                          style={[
                            styles.lightboxBadgeText,
                            { color: character.accentColor || '#F59E0B' },
                          ]}>
                          {selectedPhoto.badge}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.lightboxDetailTitle}>
                      {selectedPhoto.title}
                    </Text>
                  </View>
                </View>

                <Text style={styles.lightboxDescriptionText}>
                  {selectedPhoto.description}
                </Text>

                <View style={styles.lightboxFooterRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                  <Text style={styles.lightboxUnlockedStatus}>
                    Momento Eternizado no Álbum
                  </Text>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.four * 2 - Spacing.two) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTextCol: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overviewStats: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  percentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  photoCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.25,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.two,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(5, 8, 17, 0.82)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardSubtitle: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '500',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 15, 29, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 6,
  },
  lockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedMysteryTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hintPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hintPromptText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  // HINT MODAL
  hintModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  hintDismissBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  hintCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hintPreviewWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  hintPreviewImage: {
    width: '100%',
    height: '100%',
  },
  hintPreviewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 15, 29, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintLockBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  hintContentCol: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  hintCardTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hintCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  hintRequirementBox: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  hintIconLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintRequirementHeader: {
    fontSize: 12,
    fontWeight: '700',
  },
  hintRequirementText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  hintExplorationTip: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  hintActionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  hintActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // LIGHTBOX VIEWER
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#050811',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 36 : 48,
    paddingBottom: Spacing.two,
    backgroundColor: 'rgba(5, 8, 17, 0.9)',
  },
  lightboxCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxTitleCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  lightboxTopTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  lightboxTopChar: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  lightboxImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxBottomCard: {
    padding: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.four,
    backgroundColor: 'rgba(10, 15, 29, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: Spacing.two,
  },
  lightboxBottomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  lightboxBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lightboxDetailTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  lightboxDescriptionText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 20,
  },
  lightboxFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lightboxUnlockedStatus: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
});
