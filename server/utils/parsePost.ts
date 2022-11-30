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

/*
  id        String        @id @default(uuid())
  message   String
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  post      Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  parent    Comment?      @relation("ParentChild", fields: [parentId], references: [id])
  children  Comment[]     @relation("ParentChild")
  parentId  String?
  likes     CommentLike[]
*/

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
