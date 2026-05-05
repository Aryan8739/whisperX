import { useStore } from "@/store/useStore";

const COMMANDS = [
    { cmd: "/nick <name>", desc: "Change your display nickname" },
    { cmd: "/join <channel>", desc: "Switch to a different chat channel" },
    { cmd: "/clear", desc: "Wipe your local terminal screen" },
    { cmd: "/whoami", desc: "Display your user & auth details" },
    { cmd: "/users", desc: "List all active users in the system" },
    { cmd: "/status <msg>", desc: "Update your activity status message" },
    { cmd: "/theme <name>", desc: "Change aesthetic (green, cyberpunk, orange, red, starwars)" },
    { cmd: "/key", desc: "Get your secret Identity Key for migration" },
    { cmd: "/restore <key>", desc: "Log in to an existing identity" },
    { cmd: "/help", desc: "Show command reference in terminal" },
];

export function SettingsModal() {
    const showSettingsModal = useStore((s) => s.showSettingsModal);
    const setShowSettingsModal = useStore((s) => s.setShowSettingsModal);
    const theme = useStore((s) => s.theme);
    const setTheme = useStore((s) => s.setTheme);

    if (!showSettingsModal) return null;

    const themes = ["green", "cyberpunk", "orange", "red", "starwars"];

    return (
        <div className="nick-modal">
            <div className="nick-box settings-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ margin: 0 }}>Terminal Settings</h3>
                    <button className="close-btn" onClick={() => setShowSettingsModal(false)}>[X]</button>
                </div>

                <div className="settings-section" style={{ marginBottom: "25px" }}>
                    <h4>Switch Aesthetic</h4>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                        {themes.map((t) => (
                            <button 
                                key={t} 
                                className={`theme-btn ${theme === t ? 'active' : ''}`}
                                onClick={() => setTheme(t)}
                                style={{ 
                                    padding: "8px 12px", 
                                    fontSize: "14px",
                                    border: theme === t ? "1px solid var(--neon-color)" : "1px dashed var(--neon-dim)",
                                    background: theme === t ? "var(--neon-dim)" : "transparent",
                                    color: theme === t ? "var(--neon-color)" : "var(--neon-dim)",
                                    textTransform: "uppercase"
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-section">
                    <h4>Command Reference</h4>
                    <div className="command-list">
                        {COMMANDS.map((c) => (
                            <div key={c.cmd} className="command-item">
                                <div className="command-name">{c.cmd}</div>
                                <div className="command-desc">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <button onClick={() => setShowSettingsModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
}
