import type { ForumPostListItem, ForumViewer } from "../types";
import { PostCard } from "./post-card";

type Props = {
  posts: ForumPostListItem[];
  viewer: ForumViewer;
  threadAuthorId: string | null;
};

export function PostList({ posts, viewer, threadAuthorId }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          viewer={viewer}
          isThreadAuthorPost={index === 0 && post.user_id === threadAuthorId}
        />
      ))}
    </div>
  );
}
