import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { timeAgo } from "@/lib/timeago";
import { getUserDisplay } from "@/lib/utils";

function Post({ post, onUserClick }) {
    const isSystem = post.type === "system";

    return (
        <div className={`post ${isSystem ? 'system-post' : ''}`}>
            <div className="post-header">
                {isSystem ? (
                    <span className="system-tag">[SYSTEM]</span>
                ) : (
                    <span 
                        className="clickable-user" 
                        onClick={() => onUserClick({ uid: post.user_id, nickname: post.nickname })}
                    >
                        {getUserDisplay(post.nickname, post.user_id)}
                    </span>
                )}
                {!isSystem && <>@{post.channel} ➤ </>} 
                [{timeAgo(post.created_at)}]
            </div>
            <div className="post-text">{post.text_content}</div>
        </div>
    );
}

export function PostFeed() {
    const posts = useStore((s) => s.posts);
    const systemLogs = useStore((s) => s.systemLogs);
    const isLoading = useStore((s) => s.isLoadingPosts);
    const setActiveDMRecipient = useStore((s) => s.setActiveDMRecipient);
    const currentUser = useStore((s) => s.user);
    const typingUsers = useStore((s) => s.typingUsers);
    const onlineUsers = useStore((s) => s.onlineUsers);
    const feedRef = useRef(null);

    const setActiveOverlay = useStore((s) => s.setActiveOverlay);
    const setSelectedProfileUser = useStore((s) => s.setSelectedProfileUser);

    const allMessages = [...posts, ...systemLogs].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const otherTyping = Object.keys(typingUsers).filter(uid => uid !== currentUser?.id);

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [allMessages, otherTyping]);

    if (isLoading && !posts.length) {
        return (
            <div id="feed">
                <div className="post">
                    <div className="post-text blink">loading posts...</div>
                </div>
            </div>
        );
    }

    if (!allMessages.length) {
        return (
            <div id="feed">
                <div className="post">
                    <div className="post-text">no whispers yet. be the first.</div>
                </div>
            </div>
        );
    }

    const handleUserClick = (userObj) => {
        setSelectedProfileUser(userObj);
        setActiveOverlay("profile");
    };

    return (
        <div id="feed" ref={feedRef}>
            {allMessages.map((p) => (
                <Post 
                    key={p.id} 
                    post={p} 
                    onUserClick={handleUserClick} 
                />
            ))}
            {otherTyping.length > 0 && (
                <div className="typing-indicator post-text blink">
                    {otherTyping.map(uid => onlineUsers[uid]?.nickname || "anon").join(", ")} {otherTyping.length === 1 ? "is" : "are"} typing...
                </div>
            )}
        </div>
    );
}