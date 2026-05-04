import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { timeAgo } from "@/lib/timeago";
import { getUserDisplay } from "@/lib/utils";

export function SidePanel() {
    const isSidePanelOpen = useStore((s) => s.isSidePanelOpen);
    const toggleSidePanel = useStore((s) => s.toggleSidePanel);
    const users = useStore((s) => s.users);
    const loadUsers = useStore((s) => s.loadUsers);
    const activeDMRecipient = useStore((s) => s.activeDMRecipient);
    const setActiveDMRecipient = useStore((s) => s.setActiveDMRecipient);
    const dmPosts = useStore((s) => s.dmPosts);
    const isLoadingDMPosts = useStore((s) => s.isLoadingDMPosts);
    const postDM = useStore((s) => s.postDM);
    const currentUser = useStore((s) => s.user);

    const [dmInput, setDmInput] = useState("");

    useEffect(() => {
        if (isSidePanelOpen) {
            loadUsers();
        }
    }, [isSidePanelOpen, loadUsers]);

    if (!isSidePanelOpen) return null;

    const handleSend = (e) => {
        e.preventDefault();
        if (dmInput.trim()) {
            postDM(dmInput);
            setDmInput("");
        }
    };

    return (
        <div className="side-panel">
            <div className="side-panel-header">
                <div className="title">DIRECT MESSAGES</div>
                <button className="close-btn" onClick={toggleSidePanel}>[X]</button>
            </div>
            
            {!activeDMRecipient ? (
                <div className="users-list">
                    <div className="users-list-title">SELECT A USER</div>
                    {users.filter(u => u.uid !== currentUser?.id).map((u) => (
                        <div 
                            key={u.uid} 
                            className="user-item"
                            onClick={() => setActiveDMRecipient(u)}
                        >
                            {'>'} {getUserDisplay(u.nickname, u.uid)}
                        </div>
                    ))}
                    {users.length <= 1 && <div className="no-users">No other users online.</div>}
                </div>
            ) : (
                <div className="dm-view">
                    <div className="dm-header">
                        <button className="back-btn" onClick={() => setActiveDMRecipient(null)}>&lt; BACK</button>
                        <span>Chatting with: <span className="highlight">{getUserDisplay(activeDMRecipient.nickname, activeDMRecipient.uid)}</span></span>
                    </div>
                    
                    <div className="dm-feed">
                        {isLoadingDMPosts ? (
                            <div className="post-text blink">loading...</div>
                        ) : dmPosts.length === 0 ? (
                            <div className="post-text">No messages yet.</div>
                        ) : (
                            dmPosts.map((p) => (
                                <div key={p.id} className="dm-post">
                                    <div className="dm-post-header">
                                        {getUserDisplay(p.nickname, p.user_id)} [{timeAgo(p.created_at)}]
                                    </div>
                                    <div className="dm-post-text">{p.text_content}</div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <form className="dm-input-form" onSubmit={handleSend}>
                        <span className="dm-prompt">&gt;</span>
                        <input 
                            type="text" 
                            className="dm-input" 
                            placeholder="Type a message..."
                            value={dmInput}
                            onChange={(e) => setDmInput(e.target.value)}
                        />
                    </form>
                </div>
            )}
        </div>
    );
}
