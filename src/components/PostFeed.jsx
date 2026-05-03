import { useStore } from "@/store/useStore";
import { timeAgo } from "@/lib/timeago";
import { getUserDisplay } from "@/lib/utils";

function Post({ post, onUserClick }) {
    return (
        <div className="post">
            <div className="post-header">
                <span 
                    className="clickable-user" 
                    onClick={() => onUserClick({ uid: post.user_id, nickname: post.nickname })}
                >
                    {getUserDisplay(post.nickname, post.user_id)}
                </span>
                @{post.channel} ➤ [{timeAgo(post.created_at)}]
            </div>
            <div className="post-text">{post.text_content}</div>
        </div>
    );
}

export function PostFeed() {
    const posts = useStore((s) => s.posts);
    const isLoading = useStore((s) => s.isLoadingPosts);

    if (isLoading) {
        return (
            <div id="feed">
                <div className="post">
                    <div className="post-text blink">loading posts...</div>
                </div>
            </div>
        );
    }

    if (!posts.length) {
        return (
            <div id="feed">
                <div className="post">
                    <div className="post-text">no whispers yet. be the first.</div>
                </div>
            </div>
        );
    }

    const setActiveDMRecipient = useStore((s) => s.setActiveDMRecipient);
    const currentUser = useStore((s) => s.user);

    return (
        <div id="feed">
            {posts.map((p) => (
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