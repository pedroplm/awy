import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import '@/global.css';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ChatProvider } from '@/context/ChatContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const scrollbarThumb = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
  const scrollbarHover = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.42)';

  const scrollbarStyles = `
    html, body, #root, * {
      scrollbar-width: thin;
      scrollbar-color: ${scrollbarThumb} transparent;
    }
    *::-webkit-scrollbar {
      width: 7px;
      height: 7px;
      background-color: transparent;
    }
    *::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 9999px;
    }
    *::-webkit-scrollbar-thumb {
      background-color: ${scrollbarThumb};
      border-radius: 9999px;
      border: 1px solid transparent;
      background-clip: padding-box;
      transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    *::-webkit-scrollbar-thumb:hover {
      background-color: ${scrollbarHover};
    }
    *::-webkit-scrollbar-thumb:active {
      background-color: #d97706;
    }
    *::-webkit-scrollbar-button {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    *::-webkit-scrollbar-corner {
      background: transparent !important;
    }
  `;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ChatProvider>
        {Platform.OS === 'web' && (
          <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
        )}
        <AnimatedSplashOverlay />
        <AppTabs />
      </ChatProvider>
    </ThemeProvider>
  );
}
