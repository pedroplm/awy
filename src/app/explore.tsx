import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import { CharacterCard } from '@/components/chat/CharacterCard';
import { NewCharacterModal } from '@/components/chat/NewCharacterModal';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    characters,
    activeCharacter,
    selectCharacter,
    addCustomCharacter,
    deleteCharacter,
  } = useChat();

  const handleSelect = async (characterId: string) => {
    await selectCharacter(characterId);
    router.push('/');
  };

  const handleCreate = async (charData: Parameters<typeof addCustomCharacter>[0]) => {
    const created = await addCustomCharacter(charData);
    await selectCharacter(created.id);
    router.push('/');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.centerWrapper}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleCol}>
              <Text style={[styles.title, { color: theme.text }]}>Companions</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose who you want to roleplay with, or craft a new character.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={[styles.createButton, { backgroundColor: activeCharacter.accentColor }]}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          {/* Character Cards */}
          <View style={styles.rosterList}>
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isActive={character.id === activeCharacter.id}
                onSelect={() => handleSelect(character.id)}
                onDelete={
                  character.isCustom ? () => deleteCharacter(character.id) : undefined
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal for creating a custom character */}
      <NewCharacterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'web' ? Spacing.five : Spacing.two,
  },
  centerWrapper: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two + 2,
    borderRadius: 14,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rosterList: {
    marginTop: Spacing.two,
  },
});
