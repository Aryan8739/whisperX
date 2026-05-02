import { useState } from "react";
import { useStore } from "@/store/useStore";

export function NicknameModal() {
    const showNicknameModal = useStore((s) => s.showNicknameModal);
    const setShowNicknameModal = useStore((s) => s.setShowNicknameModal);
    const saveNickname = useStore((s) => s.saveNickname);
    const currentNickname = useStore((s) => s.nickname);
    const [value, setValue] = useState(currentNickname || "");
    const [saving, setSaving] = useState(false);

    if (!showNicknameModal) return null;

    async function handleSave() {
        const nick = value.trim();
        if (!nick) return;
        setSaving(true);
        await saveNickname(nick);
        setSaving(false);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") setShowNicknameModal(false);
    }

    return (
        <div className="nick-modal">
            <div className="nick-box">
                <h3>choose a nickname</h3>
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="shadowcat"
                    maxLength={32}
                />
                <button onClick={handleSave} disabled={saving}>
                    {saving ? "saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}