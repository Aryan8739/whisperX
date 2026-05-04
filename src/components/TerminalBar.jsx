import { useState } from "react";
import { useStore } from "@/store/useStore";

const CHANNELS = ["general", "confessions", "tech", "events", "hostel", "random"];

export function TerminalBar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const currentChannel = useStore((s) => s.currentChannel);
    const setChannel = useStore((s) => s.setChannel);
    const loadPosts = useStore((s) => s.loadPosts);
    const nickname = useStore((s) => s.nickname);
    const setShowNicknameModal = useStore((s) => s.setShowNicknameModal);
    const toggleSidePanel = useStore((s) => s.toggleSidePanel);

    async function handleChannelSwitch(ch) {
        setChannel(ch);
        setDropdownOpen(false);
        await loadPosts();
    }

    return (
        <>
            <div className="terminal-bar">
                <div className="title">CAMPUS WHISPER — CRT TERMINAL</div>
                <div className="menu">
                    <span className="menu-item" onClick={loadPosts}>Home</span>
                    <span className="menu-item" onClick={() => setDropdownOpen((v) => !v)}>
                        Channels ▾
                    </span>
                    <span
                        className="menu-item"
                        onClick={toggleSidePanel}
                    >
                        Messages
                    </span>
                    <span
                        className="menu-item"
                        onClick={() => setShowNicknameModal(true)}
                    >
                        Nickname
                    </span>
                    <span className="menu-item" onClick={() => alert("Settings coming soon!")}>
                        Settings
                    </span>
                </div>
            </div>

            {dropdownOpen && (
                <div className="dropdown">
                    {CHANNELS.map((ch) => (
                        <div
                            key={ch}
                            className={`dropdown-item${ch === currentChannel ? " active" : ""}`}
                            onClick={() => handleChannelSwitch(ch)}
                        >
                            # {ch}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}