# AWY (Always With You) 💬✨

> **Always With You** — A real-time roleplay AI companion chat application built with Expo (React Native & Web).

---

## 🌟 Overview

**AWY** is an immersive companion application designed to ensure you never feel alone. Engage in real-time, expressive roleplay conversations with diverse AI characters, each with their own personality, backstory, dialogue style, and emotional presence.

### ✨ Highlights

- **Real-Time Roleplay Chat**: Interactive dialogue with simulated real-time streaming, typing indicators, and formatted roleplay actions (e.g. `*gently smiles*` vs spoken dialogue).
- **Diverse Character Roster**:
  - 🌙 **Luna** — Gentle, empathetic companion who listens deeply.
  - ⚡ **Aria** — Cyberpunk netrunner with quick wit and sharp instincts.
  - 🌲 **Rowan** — Calm wilderness ranger and storyteller from ancient woods.
  - ✨ **Nova** — High-energy anime companion full of imagination and cheer.
- **Custom Character Creator**: Craft your own AI persona with custom emojis, accent colors, backstories, greetings, and roleplay prompts.
- **Persistent Local Memory**: Conversations and custom characters are stored locally with `@react-native-async-storage/async-storage`.
- **Flexible AI Integration**:
  - Out of the box: Works immediately with the built-in expressive roleplay companion engine (no API key required).
  - Optional LLMs: Add your Google Gemini or OpenAI API key in `.env` for direct dynamic model responses.
- **Cross-Platform**: Runs seamlessly on **Web**, **iOS**, and **Android** using Expo SDK 58 and Expo Router.

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device (optional, for physical device testing)

### 2. Environment Variables

Create your local `.env` or `.env.local` file from the provided example:

```bash
cp .env.example .env
```

> **Note**: `.env`, `.env.local`, and all `.env.*` files are completely ignored by `.gitignore` to prevent secret leaks.

Inside `.env`, you can optionally add your AI keys:

```env
# Optional: Google Gemini API key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI API key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the App

Start the Expo development server:

```bash
# Start dev server
npm start

# Run directly on web browser
npm run web

# Run on Android (emulator or device)
npm run android

# Run on iOS (macOS required)
npm run ios
```

---

## 🛠️ Code Quality & Verification

```bash
# Typecheck with TypeScript
npx tsc --noEmit

# Lint code with ESLint
npm run lint

# Check Expo dependencies & configuration
npx expo-doctor
```

---

## 📁 Project Structure

```
awy/
├── assets/                  # Icons, splash screens, and images
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── _layout.tsx      # Root layout & ChatProvider context
│   │   ├── index.tsx        # Main Real-Time Roleplay Chat Screen
│   │   └── explore.tsx      # Companion Roster & Character Creator
│   ├── components/
│   │   ├── chat/            # Chat bubbles, input bar, cards, modals
│   │   └── ...              # Themed UI components
│   ├── constants/           # Preset characters, actions, theme tokens
│   ├── context/             # ChatContext for global state & streaming
│   ├── hooks/               # Custom React & color scheme hooks
│   ├── services/            # AI generation & AsyncStorage persistence
│   └── types/               # TypeScript definitions
├── .env.example             # Safe template for environment variables
├── .gitignore               # Comprehensive ignores (.env, .expo, builds)
├── app.json                 # Expo configuration
├── package.json             # Scripts & dependencies
└── tsconfig.json            # TypeScript configuration
```

---

## 📄 License

All rights reserved.
