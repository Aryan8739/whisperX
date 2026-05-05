# 📟 WhisperX — CRT Terminal Chat

WhisperX is a high-immersion, real-time messaging platform designed with a retro-futuristic CRT terminal aesthetic. It combines the nostalgia of 80s command-line interfaces with modern real-time capabilities powered by **Supabase**.

![WhisperX Preview](https://img.shields.io/badge/UI-CRT_Terminal-00ff55?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase)
![React](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge&logo=react)

---

## ✨ Key Features

- **Authentic CRT Aesthetic**: Complete with scanlines, screen curvature, vignette, and subtle phosphor flickering.
- **Real-time Global Feed**: Instant message delivery across all users using Supabase Realtime.
- **Direct Messaging (DM)**: Private, encrypted-style communication between users with a "terminal-over-wire" feel.
- **Presence Tracking**: Live online status indicators (🟢/⚪) and channel-specific user counts.
- **Dynamic Theming Engine**: Switch between multiple aesthetics instantly:
  - `Classic Green` (Default)
  - `Cyberpunk` (Pink/Cyan)
  - `Orange` (Warm Phosphor)
  - `Red` (Tactical)
  - `Star Wars` (Yellow/Black)
- **Interactive Slash Commands**: A fully functional CLI experience for navigating and customizing the app.

---

## ⌨️ Command Reference

WhisperX is built to be used from the keyboard. Type `/help` in the terminal to see available commands:

| Command | Description |
| :--- | :--- |
| `/nick <name>` | Change your display nickname |
| `/join <channel>` | Switch to a different chat channel (general, tech, events, etc.) |
| `/theme <name>` | Switch aesthetics (green, orange, red, cyberpunk, starwars) |
| `/status <msg>` | Set a custom activity status message |
| `/clear` | Wipe your local terminal screen for a fresh start |
| `/whoami` | Display your user ID and authentication details |
| `/users` | List all active users currently online |

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS with CSS Variables for the dynamic theme engine.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Realtime)
- **Fonts**: Share Tech Mono & VT323 (Google Fonts)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase Project (URL and Anon Key)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whisperx.git
   cd whisperx
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

---

## 📜 Database Schema

WhisperX uses a lightweight but robust schema:
- `users`: Tracks `uid`, `nickname`, `status_message`, and `last_seen`.
- `posts`: Handles all messages (`type`: whisper/dm) with channel routing and expiration logic.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <i>Developed with ❤️ by <a href="https://github.com/aryan8739">Aryan Rastogi</a></i>
</p>
