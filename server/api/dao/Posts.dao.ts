import { CommentLike } from "@prisma/client";
import prisma from "../../utils/prisma";
import prismaQueryRedisCache from "../../utils/prismaQueryRedisCache";

import crypto from "crypto";

import { io } from "../..";

const parsePost = async (post: any, uid?: string) => {
  const usersCommentLikes = await prisma.commentLike.findMany({
    where: {
      userId: uid,
      commentId: { in: post.comments.map((cmt: any) => cmt.id) },
    },
  });
  console.log("UID + " + uid);
  return {
    ...post,
    tags: post.tags.map((tag: any) => tag.name),
    likedByMe: post.likes.find((like: any) => like.userId === uid)
      ? true
      : false,
    sharedByMe: post.shares.find((share: any) => share.userId === uid)
      ? true
      : false,
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
  static async getPosts(uid?: string) {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        description: true,
        author: {
          select: {
            id: true,
          },
        },
        likes: true,
        shares: true,
        tags: true,
      },
    });
    console.log(uid);
    return posts.map((post) => {
      let likedByMe = false;
      let sharedByMe = false;
      likedByMe = post.likes.find((like) => like.userId === uid) ? true : false;
      sharedByMe = post.shares.find((share) => share.userId === uid)
        ? true
        : false;
      return {
        ...post,
        likes: post.likes.length,
        shares: post.shares.length,
        tags: post.tags.map((tag) => tag.name),
        likedByMe,
        sharedByMe,
      };
    });
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
          tags: true,
          likes: true,
          shares: true,
        },
      }),
      5
    ).then(async (post) => parsePost(post, uid));
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
          tags: true,
          likes: true,
          shares: true,
        },
      }),
      5
    ).then(async (post) => parsePost(post, uid));
    return post;
  }

  static async createPost(
    title: string,
    body: string,
    description: string,
    tags: string,
    authorId: string
  ) {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      crypto.randomBytes(64).toString("hex").slice(0, 6);
    const post = await prisma.post.create({
      data: {
        title,
        body,
        authorId,
        description,
        slug,
        tags: {
          connectOrCreate: tags
            .split("#")
            .filter((tag) => tag !== "")
            .map((tag) => {
              const name = tag.trim().toLowerCase();
              return {
                where: { name },
                create: { name },
              };
            }),
        },
      },
    });
    return post;
  }

  static async updatePost(
    title: string,
    body: string,
    description: string,
    tags: string,
    authorId: string,
    slug: string
  ) {
    const post = await prisma.post.update({
      where: {
        slug,
      },
      data: {
        title,
        body,
        authorId,
        description,
        tags: {
          connectOrCreate: tags
            .split("#")
            .filter((tag) => tag !== "")
            .map((tag) => {
              const name = tag.trim().toLowerCase();
              return {
                where: { name },
                create: { name },
              };
            }),
        },
      },
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
      "comment_added",
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
    io.to(slug).emit("comment_updated", message, commentId, uid);
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
    console.log("Deleting comment " + commentId)
    io.to(slug).emit("comment_deleted", commentId, uid);
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
      io.to(newLike.comment.post.slug).emit("comment_liked", true, uid);
      return { addLike: true };
    } else {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: data,
        },
      });
      io.to(like.comment.post.slug).emit("comment_liked", false, uid);
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

  static async togglePostShare(postId: string, uid: string) {
    const data = { userId: uid, postId };
    const share = await prisma.postShare.findUnique({
      where: { userId_postId: data },
    });
    if (share == null) {
      await prisma.postShare.create({ data });
      return { addShare: true };
    } else {
      await prisma.postShare.delete({
        where: {
          userId_postId: data,
        },
      });
      return { addShare: false };
    }
  }
}
