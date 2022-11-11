import { CommentLike } from "@prisma/client";
import prisma from "../../utils/prisma";
import prismaQueryRedisCache from "../../utils/prismaQueryRedisCache";

import crypto from "crypto";

import { io } from "../..";

const parsePostComments = async (post: any, uid?: string) => {
  const usersCommentLikes = await prisma.commentLike.findMany({
    where: {
      userId: uid,
      commentId: { in: post.comments.map((cmt: any) => cmt.id) },
    },
  });
  return {
    ...post,
    comments: post.comments.map((cmt: any) => {
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
    }),
  };
};

export default class PostsDAO {
  static async getPosts() {
    const posts = await prismaQueryRedisCache(
      "all-posts",
      prisma.post.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          createdAt: true,
          description: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      15
    );
    return posts;
  }

  static async getPostById(id: string, uid?: string | undefined) {
    const post = await prismaQueryRedisCache(
      `post:${id}`,
      prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              message: true,
              parentId: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: { select: { likes: true } },
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      5
    ).then(async (post) => parsePostComments(post, uid));
    return post;
  }

  static async getPostBySlug(slug: string, uid?: string | undefined) {
    const post = await prismaQueryRedisCache(
      `post:${slug}`,
      prisma.post.findUnique({
        where: { slug },
        include: {
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              message: true,
              parentId: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: { select: { likes: true } },
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      5
    ).then(async (post) => parsePostComments(post, uid));
    return post;
  }

  static async createPost(
    title: string,
    body: string,
    description: string,
    authorId: string
  ) {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      crypto.randomBytes(64).toString("hex").slice(0, 6);
    const post = await prisma.post.create({
      data: { title, body, authorId, description, slug },
    });
    return post;
  }

  static async addComment(
    message: string,
    uid: string,
    postId: string,
    parentId: string | undefined = undefined,
    name: string
  ) {
    const comment = await prisma.comment
      .create({
        data: {
          message,
          userId: uid,
          postId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          post: {
            select: {
              slug: true,
            },
          },
        },
      })
      .then((comment) => ({
        ...comment,
        likeCount: 0,
        likedByMe: false,
      }));
    io.to(comment.post.slug).emit(
      "commentAdded",
      message,
      comment.id,
      parentId,
      uid,
      name
    );
    return comment;
  }

  static async updateComment(message: string, commentId: string, uid: string) {
    const {
      userId,
      post: { slug },
    } = await prisma.comment.findUniqueOrThrow({
      where: { id: commentId },
      select: { userId: true, post: { select: { slug: true } } },
    });
    if (!userId || userId !== uid) return false;
    io.to(slug).emit("commentUpdated", message, commentId, uid);
    return await prisma.comment.update({
      where: { id: commentId },
      data: { message },
      select: { message: true },
    });
  }

  static async deleteComment(commentId: string, uid: string) {
    const {
      userId,
      post: { slug },
    } = await prisma.comment.findUniqueOrThrow({
      where: { id: commentId },
      select: { userId: true, post: { select: { slug: true } } },
    });
    if (!userId || userId !== uid) return false;
    io.to(slug).emit("commentDeleted", commentId, uid);
    return await prisma.comment.delete({
      where: { id: commentId },
      select: { id: true },
    });
  }

  static async toggleCommentLike(commentId: string, uid: string) {
    const data = { userId: uid, commentId };
    const like = await prisma.commentLike.findUnique({
      where: { userId_commentId: data },
      include: {
        comment: {
          select: { post: { select: { slug: true } } },
        },
      },
    });
    if (like == null) {
      const newLike = await prisma.commentLike.create({
        data,
        include: { comment: { select: { post: { select: { slug: true } } } } },
      });
      io.to(newLike.comment.post.slug).emit("commentLiked", true, uid);
      return { addLike: true };
    } else {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: data,
        },
      });
      io.to(like.comment.post.slug).emit("commentLiked", false, uid);
      return { addLike: false };
    }
  }

  static async togglePostLike(postId: string, uid: string) {
    const data = { userId: uid, postId };
    const like = await prisma.postLike.findUnique({
      where: { userId_postId: data },
    });
    if (like == null) {
      await prisma.postLike.create({ data });
      return { addLike: true };
    } else {
      await prisma.postLike.delete({
        where: {
          userId_postId: data,
        },
      });
      return { addLike: false };
    }
  }
}
