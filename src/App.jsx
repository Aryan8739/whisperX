import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useRealtime } from "@/hooks/useRealtime";
import { TerminalBar } from "@/components/TerminalBar";
import { PostFeed } from "@/components/PostFeed";
import { TerminalInput } from "@/components/TerminalInput";
import { NicknameModal } from "@/components/NicknameModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidePanel } from "@/components/SidePanel";
import { SettingsModal } from "@/components/SettingsModal";

export default function App() {
    const ensureAuth = useStore((s) => s.ensureAuth);
    const getOrCreateUserRow = useStore((s) => s.getOrCreateUserRow);
    const setNickname = useStore((s) => s.setNickname);
    const setShowNicknameModal = useStore((s) => s.setShowNicknameModal);
    const loadPosts = useStore((s) => s.loadPosts);
    const nickname = useStore((s) => s.nickname);
    const theme = useStore((s) => s.theme);

    useRealtime();

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        async function init() {
            const user = await ensureAuth();
            if (!user) {
                console.error("Could not authenticate with Supabase. Check connection.");
                return;
            }
            const userRow = await getOrCreateUserRow(user.id);

            const savedNick = localStorage.getItem("nickname") || userRow?.nickname;
            if (savedNick) {
                setNickname(savedNick);
            } else {
                setShowNicknameModal(true);
            }

            await loadPosts();
        }

        init();
    }, []);

    return (
        <>
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
        </>
    );
}