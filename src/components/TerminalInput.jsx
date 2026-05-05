import { useState } from "react";
import { useStore } from "@/store/useStore";

export function TerminalInput() {
    const [text, setText] = useState("");
    const postWhisper = useStore((s) => s.postWhisper);
    const nickname = useStore((s) => s.nickname);
    const currentChannel = useStore((s) => s.currentChannel);
    const isPosting = useStore((s) => s.isPosting);

    const setNickname = useStore((s) => s.saveNickname);
    const setChannel = useStore((s) => s.setChannel);
    const loadPosts = useStore((s) => s.loadPosts);

    async function handleKeyDown(e) {
        if (e.key === "Enter") {
            const trimmed = text.trim();
            if (!trimmed || isPosting) return;

            if (trimmed.startsWith("/")) {
                const [cmd, ...args] = trimmed.slice(1).split(" ");
                const arg = args.join(" ");

                if (cmd === "nick") {
                    if (arg) await setNickname(arg);
                    else alert("Usage: /nick <new_nickname>");
                } else if (cmd === "join") {
                    if (arg) {
                        setChannel(arg);
                        await loadPosts();
                    } else alert("Usage: /join <channel_name>");
                } else if (cmd === "help") {
                    alert("Available commands:\n/nick <name> - Change nickname\n/join <channel> - Switch channel\n/help - Show this list");
                } else {
                    alert(`Unknown command: ${cmd}`);
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