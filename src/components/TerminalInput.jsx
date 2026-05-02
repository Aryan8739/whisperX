import { useState } from "react";
import { useStore } from "@/store/useStore";

export function TerminalInput() {
    const [text, setText] = useState("");
    const postWhisper = useStore((s) => s.postWhisper);
    const nickname = useStore((s) => s.nickname);
    const currentChannel = useStore((s) => s.currentChannel);
    const isPosting = useStore((s) => s.isPosting);

    async function handleKeyDown(e) {
        if (e.key === "Enter") {
            const trimmed = text.trim();
            if (!trimmed || isPosting) return;
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