import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';

interface Props {
  color?: string;
  size?: number;
}

export function TypingDots({ color = '#6366F1', size = 7 }: Props) {
  const [dot1] = useState(() => new Animated.Value(0));
  const [dot2] = useState(() => new Animated.Value(0));
  const [dot3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -5,
              duration: 280,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 280,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.delay(300),
          ])
        ),
      ]);
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 140);
    const anim3 = createAnimation(dot3, 280);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ translateY: dot1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ translateY: dot2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ translateY: dot3 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 14,
    paddingHorizontal: 2,
  },
  dot: {
    opacity: 0.9,
  },
});
