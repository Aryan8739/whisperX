import { useState } from "react";
import { useStore } from "@/store/useStore";
import { playClick, playError, playBlip } from "@/lib/audio";

export function TerminalInput() {
    const [text, setText] = useState("");
    const postWhisper = useStore((s) => s.postWhisper);
    const nickname = useStore((s) => s.nickname);
    const currentChannel = useStore((s) => s.currentChannel);
    const isPosting = useStore((s) => s.isPosting);

    const setNickname = useStore((s) => s.saveNickname);
    const setChannel = useStore((s) => s.setChannel);
    const loadPosts = useStore((s) => s.loadPosts);
    const addSystemMessage = useStore((s) => s.addSystemMessage);
    const clearLocalLogs = useStore((s) => s.clearLocalLogs);
    const updateUserStatus = useStore((s) => s.updateUserStatus);
    const users = useStore((s) => s.users);
    const user = useStore((s) => s.user);
    const setTheme = useStore((s) => s.setTheme);

    async function handleKeyDown(e) {
        // Play mechanical click on every keypress
        if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
            playClick();
        }

        if (e.key === "Enter") {
            const trimmed = text.trim();
            if (!trimmed || isPosting) return;

            if (trimmed.startsWith("/")) {
                const [cmd, ...args] = trimmed.slice(1).split(" ");
                const arg = args.join(" ").trim();

                switch (cmd) {
                    case "nick":
                        if (arg) await setNickname(arg);
                        else {
                            addSystemMessage("Usage: /nick <new_nickname>");
                            playError();
                        }
                        break;
                    case "join":
                        if (arg) {
                            setChannel(arg);
                            await loadPosts();
                            addSystemMessage(`Switched to channel: #${arg}`);
                            playBlip();
                        } else {
                            addSystemMessage("Usage: /join <channel_name>");
                            playError();
                        }
                        break;
                    case "help":
                        addSystemMessage("AVAILABLE COMMANDS:\n/nick <name> - Change nickname\n/join <channel> - Switch channel\n/clear - Wipe terminal screen\n/whoami - Show your user info\n/users - List active users\n/status <msg> - Set activity status\n/theme <name> - Switch terminal theme (green, cyberpunk, orange, red, starwars)");
                        break;
                    case "clear":
                        clearLocalLogs();
                        addSystemMessage("Terminal cleared.");
                        break;
                    case "whoami":
                        addSystemMessage(`USER INFO:\nID: ${user?.id}\nNICK: ${nickname || "anon"}\nAUTH: ${user?.is_anonymous ? "Anonymous" : "Authenticated"}`);
                        break;
                    case "users":
                        const userList = users.map(u => `- ${u.nickname || 'anon'} (${u.uid.substring(0,4)})`).join("\n");
                        addSystemMessage(`ACTIVE USERS:\n${userList || "No other users found."}`);
                        break;
                    case "status":
                        await updateUserStatus(arg);
                        break;
                    case "theme":
                        const validThemes = ["green", "cyberpunk", "orange", "red", "starwars"];
                        if (validThemes.includes(arg.toLowerCase())) {
                            setTheme(arg.toLowerCase());
                            addSystemMessage(`Theme updated to: ${arg}`);
                            playBlip();
                        } else {
                            addSystemMessage(`Invalid theme. Available: ${validThemes.join(", ")}`);
                            playError();
                        }
                        break;
                    default:
                        addSystemMessage(`Unknown command: ${cmd}. Type /help for assistance.`);
                        playError();
                }
                setText("");
                return;
            }

            setText("");
            await postWhisper(trimmed);
        }
    }

    return (
        <div id="terminal">
            <span id="prompt">{nickname || "anon"}@{currentChannel}:~$</span>
            <input
                id="terminal-input"
                type="text"
                autoComplete="off"
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPosting}
                placeholder={isPosting ? "sending..." : ""}
            />
        </div>
    );
}