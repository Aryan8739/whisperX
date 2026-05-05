import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { useRealtime } from "@/hooks/useRealtime";
import { playStartup } from "@/lib/audio";
import { TerminalBar } from "@/components/TerminalBar";
import { PostFeed } from "@/components/PostFeed";
import { TerminalInput } from "@/components/TerminalInput";
import { NicknameModal } from "@/components/NicknameModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidePanel } from "@/components/SidePanel";
import { SettingsModal } from "@/components/SettingsModal";
import { MatrixEffect } from "@/components/MatrixEffect";
import { SnakeGame } from "@/components/SnakeGame";

export default function App() {
    const ensureAuth = useStore((s) => s.ensureAuth);
    const getOrCreateUserRow = useStore((s) => s.getOrCreateUserRow);
    const setNickname = useStore((s) => s.setNickname);
    const setShowNicknameModal = useStore((s) => s.setShowNicknameModal);
    const loadPosts = useStore((s) => s.loadPosts);
    const loadUsers = useStore((s) => s.loadUsers);
    const loadRecentConversations = useStore((s) => s.loadRecentConversations);
    const activeOverlay = useStore((s) => s.activeOverlay);
    const setActiveOverlay = useStore((s) => s.setActiveOverlay);
    const selectedProfileUser = useStore((s) => s.selectedProfileUser);
    const onlineUsers = useStore((s) => s.onlineUsers);
    const theme = useStore((s) => s.theme);
    const [isBooting, setIsBooting] = useState(true);

    const isSidePanelOpen = useStore((s) => s.isSidePanelOpen);

    useRealtime();

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        async function init() {
            const user = await ensureAuth();
            if (!user) return;

            const userRow = await getOrCreateUserRow(user.id);
            const savedNick = localStorage.getItem("nickname") || userRow?.nickname;
            if (savedNick) setNickname(savedNick);
            else setShowNicknameModal(true);

            await Promise.all([
                loadPosts(),
                loadUsers(),
                loadRecentConversations()
            ]);
            
            playStartup();
            setTimeout(() => setIsBooting(false), 2000);
        }
        init();
    }, []);

    if (isBooting) {
        return (
            <div className="boot-screen">
                <div className="crt" />
                <div className="boot-text">
                    <p>WHISPER-X v2.0.0</p>
                    <p>SYSTEM INITIALIZING...</p>
                    <p>MEM CHECK: 640KB OK</p>
                    <p>LINKING TO SUPABASE CLOUD...</p>
                    <p className="blink">READY_</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <TerminalBar />
            <div className="crt" aria-hidden="true" />
            <div className="main-layout">
                <div className="main-content">
                    <ErrorBoundary>
                        <PostFeed />
                    </ErrorBoundary>
                </div>
                <SidePanel />
            </div>
            <TerminalInput />
            <NicknameModal />
            <SettingsModal />

            {activeOverlay === "matrix" && <MatrixEffect onClose={() => setActiveOverlay(null)} />}
            {activeOverlay === "snake" && <SnakeGame onClose={() => setActiveOverlay(null)} />}
        </div>
    );
}