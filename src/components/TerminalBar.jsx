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
    const onlineUsers = useStore((s) => s.onlineUsers);

    // Calculate users per channel
    const channelCounts = {};
    CHANNELS.forEach(ch => channelCounts[ch] = 0);
    Object.values(onlineUsers).forEach(u => {
        if (channelCounts[u.channel] !== undefined) {
            channelCounts[u.channel]++;
        }
    });

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
                            # {ch} <span style={{ opacity: 0.6, fontSize: "0.8em", marginLeft: "8px" }}>({channelCounts[ch]} online)</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}