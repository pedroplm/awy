import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieceSymbol, Color } from 'chess.js';

interface Props {
  type: PieceSymbol;
  color: Color;
  size: number;
}

const GLYPH_MAP: Record<PieceSymbol, keyof typeof MaterialCommunityIcons.glyphMap> = {
  p: 'chess-pawn',
  r: 'chess-rook',
  n: 'chess-knight',
  b: 'chess-bishop',
  q: 'chess-queen',
  k: 'chess-king',
};

export function ChessPieceIcon({ type, color, size }: Props) {
  const iconName = GLYPH_MAP[type];
  const isWhite = color === 'w';

  // White pieces: creamy ivory with drop shadow
  // Black pieces: deep warm charcoal/espresso with subtle golden/amber accent
  const iconColor = isWhite ? '#FFFFFF' : '#1A1817';
  const strokeColor = isWhite ? '#785A3C' : '#F59E0B';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Subtle outline effect for crisp contrast on light/dark wooden squares */}
      <MaterialCommunityIcons
        name={iconName}
        size={size * 0.88}
        color={strokeColor}
        style={[
          styles.outline,
          {
            shadowColor: isWhite ? '#000' : '#F59E0B',
            shadowOpacity: isWhite ? 0.35 : 0.25,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
          },
        ]}
      />
      <MaterialCommunityIcons
        name={iconName}
        size={size * 0.84}
        color={iconColor}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outline: {
    position: 'absolute',
  },
  icon: {
    position: 'absolute',
  },
});
