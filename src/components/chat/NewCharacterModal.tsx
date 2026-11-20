import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Character } from '@/types/chat';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (char: Omit<Character, 'id' | 'isCustom'>) => void;
}

const EMOJI_OPTIONS = ['🦊', '🔮', '⚔️', '🌸', '👑', '🐉', '🚀', '☕', '🎭', '🐺', '🐱', '🤖'];
const COLOR_OPTIONS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

export function NewCharacterModal({ visible, onClose, onCreate }: Props) {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🔮');
  const [tagline, setTagline] = useState('');
  const [personality, setPersonality] = useState('');
  const [greeting, setGreeting] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [lore, setLore] = useState('');
  const [accentColor, setAccentColor] = useState(COLOR_OPTIONS[0]);

  const handleSave = () => {
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      avatar,
      tagline: tagline.trim() || 'Custom Companion',
      personality: personality.trim() || 'Friendly and attentive companion.',
      greeting:
        greeting.trim() ||
        `*smiles warmly* Hello! I'm ${name.trim()}. I'm always with you. How can I help today?`,
      systemPrompt:
        systemPrompt.trim() ||
        `You are ${name.trim()}, a supportive and authentic AI companion in AWY. Use asterisk roleplay actions and speak directly to the user.`,
      lore: lore.trim() || undefined,
      accentColor,
      tags: ['Custom', 'Companion'],
    });

    setName('');
    setTagline('');
    setPersonality('');
    setGreeting('');
    setSystemPrompt('');
    setLore('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create AI Companion</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={true} indicatorStyle="white">
            {/* Avatar Selection */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Pick an Avatar Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiList}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setAvatar(e)}
                  style={[
                    styles.emojiOption,
                    {
                      backgroundColor: avatar === e ? accentColor : theme.backgroundElement,
                      borderColor: avatar === e ? '#FFFFFF' : 'transparent',
                    },
                  ]}>
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Accent Color Selection */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Theme Accent Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setAccentColor(c)}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: c,
                      borderWidth: accentColor === c ? 3 : 0,
                      borderColor: theme.text,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Name */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Character Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="e.g. Zephyr, Seraphina, Ghost..."
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />

            {/* Tagline */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>One-Line Tagline</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="e.g. Mysterious wanderer from distant stars"
              placeholderTextColor={theme.textSecondary}
              value={tagline}
              onChangeText={setTagline}
            />

            {/* Personality */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>Personality Traits</Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="e.g. Cynical but soft-hearted, fiercely loyal, sarcastic..."
              placeholderTextColor={theme.textSecondary}
              value={personality}
              onChangeText={setPersonality}
              multiline
            />

            {/* Greeting */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Opening Greeting (supports *roleplay actions*)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="e.g. *emerges from the shadows with a nod* What brings you here?"
              placeholderTextColor={theme.textSecondary}
              value={greeting}
              onChangeText={setGreeting}
              multiline
            />

            {/* System Prompt */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              AI Roleplay Prompt & Instructions
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Instructions for how the AI should roleplay and react to you..."
              placeholderTextColor={theme.textSecondary}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              multiline
            />

            {/* Lore & Knowledge Base (RAG) */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Character Knowledge & Lore (RAG Memory - Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Facts, world-building rules or secrets this character should know (one per line)..."
              placeholderTextColor={theme.textSecondary}
              value={lore}
              onChangeText={setLore}
              multiline
            />

            <View style={{ height: Spacing.six }} />
          </ScrollView>

          {/* Create Button */}
          <View style={[styles.footer, { borderTopColor: theme.backgroundElement }]}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              style={[
                styles.submitButton,
                { backgroundColor: name.trim() ? accentColor : theme.backgroundSelected },
              ]}>
              <Text
                style={[
                  styles.submitButtonText,
                  { color: name.trim() ? '#FFFFFF' : theme.textSecondary },
                ]}>
                Bring Character to Life
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.one,
  },
  form: {
    padding: Spacing.four,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  emojiList: {
    marginBottom: Spacing.two,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
    borderWidth: 2,
  },
  emojiText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 64,
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    paddingVertical: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
