import { useStore } from "@/store/useStore";
import { timeAgo } from "@/lib/timeago";
import { getUserDisplay } from "@/lib/utils";

function Post({ post }) {
    return (
        <div className="post">
            <div className="post-header">
                {getUserDisplay(post.nickname, post.user_id)}@{post.channel} ➤ [{timeAgo(post.created_at)}]
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

    return (
        <div id="feed">
            {posts.map((p) => (
                <Post key={p.id} post={p} />
            ))}
        </div>
    );
}