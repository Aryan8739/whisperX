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

    const allMessages = [...posts, ...systemLogs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

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

    return (
        <div id="feed">
            {allMessages.map((p) => (
                <Post 
                    key={p.id} 
                    post={p} 
                    onUserClick={(userObj) => {
                        if (userObj.uid !== currentUser?.id) {
                            setActiveDMRecipient(userObj);
                        }
                    }} 
                />
            ))}
        </div>
    );
}