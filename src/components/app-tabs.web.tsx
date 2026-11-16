import React, { useState } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { useRouter } from 'expo-router';
import {
  Pressable,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing } from '@/constants/theme';
import { useChat } from '@/context/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';
import { UsageModal } from './chat/UsageModal';
import { getMarinaStageImage } from '@/constants/characters';

export default function AppTabs() {
  return (
    <Tabs style={styles.container}>
      <TabList asChild>
        <CustomSidebar>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="chatbubble-ellipses-outline">Chat</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="compass-outline">Companions</TabButton>
          </TabTrigger>
        </CustomSidebar>
      </TabList>
      <TabSlot style={styles.tabSlot} />
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon?: keyof typeof Ionicons.glyphMap }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      {...(props as any)}
      style={({ pressed }) => [
        styles.tabButtonPressable,
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused ? colors.backgroundSelected : 'transparent',
          },
        ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? colors.text : colors.textSecondary}
            style={styles.tabIcon}
          />
        )}
        <ThemedText
          type={isFocused ? 'smallBold' : 'small'}
          style={{ color: isFocused ? colors.text : colors.textSecondary }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomSidebar(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { characters, activeCharacter, selectCharacter, currentBarrier } = useChat();
  const router = useRouter();
  const [usageModalVisible, setUsageModalVisible] = useState(false);

  return (
    <View
      {...props}
      style={[
        props.style,
        styles.sidebar,
        {
          backgroundColor: colors.background,
          borderRightColor: colors.backgroundElement,
        },
      ]}>
      {/* Brand Header with Settings / Usage Gear Button */}
      <View style={styles.brandHeader}>
        <View
          style={[
            styles.brandIcon,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: activeCharacter?.accentColor || colors.text,
            },
          ]}>
          <Ionicons
            name="sparkles"
            size={16}
            color={activeCharacter?.accentColor || colors.text}
          />
        </View>
        <View style={styles.brandInfo}>
          <ThemedText type="smallBold" style={styles.brandTitle}>
            AWY
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Always With You
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={() => setUsageModalVisible(true)}
          style={[styles.gearButton, { backgroundColor: colors.backgroundElement }]}
          accessibilityLabel="Monitor de consumo de tokens e custos">
          <Ionicons name="settings-outline" size={17} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Navigation (Chat and Companions) */}
      <View style={styles.navSection}>{props.children}</View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.backgroundElement },
        ]}
      />

      {/* Companions Section Header */}
      <View style={styles.sectionHeader}>
        <ThemedText
          style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          COMPANIONS ({characters.length})
        </ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.backgroundElement }]}
          onPress={() => router.push('/explore')}
          accessibilityLabel="Explore all companions"
          activeOpacity={0.7}>
          <Ionicons name="add" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Companions List */}
      <ScrollView
        style={styles.companionList}
        contentContainerStyle={styles.companionListContent}
        showsVerticalScrollIndicator={true}>
        {characters.map((character) => {
          const isActive = character.id === activeCharacter?.id;
          const isMarina = character.id === 'marina' || character.id === 'helena';
          const avatarSrc = isMarina
            ? getMarinaStageImage(currentBarrier ?? character.initialBarrier ?? 98)
            : character.avatarImage;
          return (
            <Pressable
              key={character.id}
              onPress={async () => {
                await selectCharacter(character.id);
                router.push('/');
              }}
              style={({ pressed }) => [
                styles.companionItem,
                {
                  backgroundColor: isActive
                    ? colors.backgroundSelected
                    : 'transparent',
                },
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.companionAvatar,
                  {
                    borderColor: character.accentColor,
                    backgroundColor: colors.backgroundElement,
                  },
                ]}>
                {avatarSrc ? (
                  <Image
                    source={avatarSrc}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <ThemedText style={styles.avatarEmoji}>
                    {character.avatar}
                  </ThemedText>
                )}
              </View>

              <View style={styles.companionDetails}>
                <View style={styles.companionNameRow}>
                  <ThemedText
                    type={isActive ? 'smallBold' : 'small'}
                    style={[styles.companionName, { color: colors.text }]}
                    numberOfLines={1}>
                    {character.name}
                  </ThemedText>
                  {character.isCustom && (
                    <View
                      style={[
                        styles.customTag,
                        { backgroundColor: character.accentColor },
                      ]}>
                      <ThemedText style={styles.customTagText}>
                        Custom
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText
                  style={[
                    styles.companionTagline,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {character.tagline}
                </ThemedText>
              </View>

              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: character.accentColor },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer Active Character Status */}
      {activeCharacter && (
        <View
          style={[
            styles.footer,
            { borderTopColor: colors.backgroundElement },
          ]}>
          <View
            style={[
              styles.footerAvatar,
              {
                borderColor: activeCharacter.accentColor,
                backgroundColor: colors.backgroundElement,
              },
            ]}>
            {(activeCharacter.id === 'marina' || activeCharacter.id === 'helena') ? (
              <Image
                source={getMarinaStageImage(currentBarrier ?? activeCharacter.initialBarrier ?? 98)}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : activeCharacter.avatarImage ? (
              <Image
                source={activeCharacter.avatarImage}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <ThemedText style={styles.footerEmoji}>
                {activeCharacter.avatar}
              </ThemedText>
            )}
          </View>
          <View style={styles.footerInfo}>
            <ThemedText
              type="smallBold"
              style={{ color: colors.text }}
              numberOfLines={1}>
              {activeCharacter.name}
            </ThemedText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  currentBarrier !== null && {
                    backgroundColor:
                      currentBarrier > 80
                        ? '#EF4444'
                        : currentBarrier > 50
                        ? '#F59E0B'
                        : currentBarrier > 20
                        ? '#8B5CF6'
                        : '#10B981',
                  },
                ]}
              />
              <ThemedText
                style={[styles.statusText, { color: colors.textSecondary }]}>
                {currentBarrier !== null
                  ? `Intimidade: ${100 - currentBarrier}% (Defesas: ${currentBarrier}%)`
                  : 'Roleplay Active'}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Usage & Token Monitor Modal */}
      <UsageModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    width: 290,
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    borderRightWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandInfo: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  gearButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navSection: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  tabButtonPressable: {
    width: '100%',
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    gap: Spacing.two,
  },
  tabIcon: {
    marginRight: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companionList: {
    flex: 1,
  },
  companionListContent: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    gap: 4,
  },
  companionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    gap: Spacing.two,
  },
  companionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  companionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  companionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companionName: {
    fontSize: 13,
  },
  customTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  companionTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  activeIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  footerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  footerEmoji: {
    fontSize: 15,
  },
  footerInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.7,
  },
});
