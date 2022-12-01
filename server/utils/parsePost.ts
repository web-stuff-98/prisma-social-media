import { Comment, CommentLike, Post } from "@prisma/client";
import prisma from "./prisma";

export type ParsedPost = Omit<
  Post,
  "comments" | "likes" | "shares" | "tags"
> & {
  likes: number;
  shares: number;
  likedByMe: boolean;
  sharedByMe: boolean;
  comments: ParsedComment[];
  tags: string[];
};

export type ParsedComment = Omit<Comment, "likes" | "children"> & {
  likeCount: number;
  likedByMe: number;
};

export default async (post: any, uid?: string) => {
  const usersCommentLikes = await prisma.commentLike.findMany({
    where: {
      userId: uid,
      commentId: { in: post.comments.map((cmt: any) => cmt.id) },
    },
  });
  return {
    ...post,
    tags: post.tags.map((tag: any) => tag.name),
    likedByMe: post.likes.find((like: any) => like.userId === uid)
      ? true
      : false,
    likes: post.likes.length,
    sharedByMe: post.shares.find((share: any) => share.userId === uid)
      ? true
      : false,
    shares: post.shares.length,
    comments: post.comments.map(
      (cmt: Comment & { _count: { likes: number } }) => {
        const { _count, ...commentFields } = cmt;
        return {
          ...commentFields,
          likedByMe:
            usersCommentLikes.length > 0
              ? usersCommentLikes.find(
                  (like: CommentLike) => like.commentId === cmt.id
                )
              : undefined,
          likeCount: _count.likes,
        };
      }
    ),
  };
};
