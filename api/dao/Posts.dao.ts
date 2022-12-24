import prisma from "../../utils/prisma";
import crypto from "crypto";
import { io } from "../..";
import AWS from "../../utils/aws";

import parsePost, { ParsedPost } from "../../utils/parsePost";
import getPage from "../../utils/getPageData";
import internal from "stream";
import busboy from "busboy";
import imageProcessing from "../../utils/imageProcessing";
import readableStreamToBlob from "../../utils/readableStreamToBlob";
import getUserSocket from "../../utils/getUserSocket";
import { Post } from "@prisma/client";

const S3 = new AWS.S3();

export default class PostsDAO {
  static async getPosts(uid?: string) {
    const posts = await prisma.post.findMany({
      where: { imagePending: false },
      select: {
        _count: { select: { comments: true, likes: true, shares: true } },
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
        tags: true,
        imageKey: true,
        blur: true,
        likes: true,
        shares: true,
      },
    });
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
        commentCount: post._count.comments || 0,
      };
    });
  }

  static async getPage(
    page: number,
    query: { term?: string; tags?: string; mode?: string; order?: string },
    uid?: string
  ) {
    const data = await getPage(
      {
        tags: query.tags || "",
        term: query.term || "",
        mode: query.mode || "",
        order: query.order || "",
      },
      { page },
      uid
    );
    return data;
  }

  static async deletePostBySlug(slug: string, uid: string) {
    let post: Post;
    try {
      post = await prisma.post.findUniqueOrThrow({ where: { slug } });
    } catch (error) {
      throw new Error("Could not find post");
    }
    if (post.authorId !== uid) throw new Error("Unauthorized");
    await prisma.post.delete({
      where: { slug },
    });
    if (!post.imagePending)
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          { Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + post.imageKey}`, Bucket: "prisma-socialmedia" },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    io.to(`post_card=${slug}`).emit("post_visible_deleted", slug);
  }

  static async getPostById(
    id: string,
    uid?: string | undefined
  ): Promise<ParsedPost> {
    const post = await prisma.post
      .findUnique({
        where: { id },
        include: {
          _count: { select: { comments: true, likes: true, shares: true } },
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              message: true,
              parentId: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  id: true,
                },
              },
              likes: true,
              _count: {
                select: { likes: true },
              },
            },
          },
          author: {
            select: {
              id: true,
            },
          },
          tags: true,
          likes: true,
          shares: true,
        },
      })
      .then(async (post) => parsePost(post, uid));
    return post;
  }

  static async getPostBySlug(
    slug: string,
    uid?: string | undefined
  ): Promise<ParsedPost> {
    const post = await prisma.post
      .findUnique({
        where: { slug },
        include: {
          _count: { select: { comments: true, likes: true, shares: true } },
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              message: true,
              parentId: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  id: true,
                },
              },
              _count: {
                select: { likes: true },
              },
            },
          },
          author: {
            select: {
              id: true,
            },
          },
          tags: true,
          likes: true,
          shares: true,
        },
      })
      .then(async (post) => parsePost(post, uid));
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
    io.to(`post_card=${slug}`).emit("post_visible_update", post);
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
      name,
      comment.post.slug
    );
    io.to(`post_card=${comment.post.slug}`).emit(
      "post_visible_comment_update",
      true,
      comment.post.slug
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
    io.to(slug).emit("comment_updated", message, commentId, uid, slug);
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
    io.to(slug).emit("comment_deleted", commentId, uid, slug);
    io.to(`post_card=${slug}`).emit("post_visible_comment_update", false, slug);
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
      io.to(newLike.comment.post.slug).emit(
        "comment_liked",
        true,
        uid,
        newLike.comment.post.slug
      );
      return { addLike: true };
    } else {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: data,
        },
      });
      io.to(like.comment.post.slug).emit(
        "comment_liked",
        false,
        uid,
        like.comment.post.slug
      );
      return { addLike: false };
    }
  }

  static async togglePostLike(postId: string, uid: string) {
    const data = { userId: uid, postId };
    const like = await prisma.postLike.findUnique({
      where: { userId_postId: data },
    });
    let addLike = false;
    if (like == null) {
      await prisma.postLike.create({ data });
      addLike = true;
    } else {
      await prisma.postLike.delete({
        where: {
          userId_postId: data,
        },
      });
      addLike = false;
    }
    const post = await prisma.post.findFirst({
      where: { id: postId },
      select: { slug: true },
    });
    const socket = await getUserSocket(uid);
    io.to(`post_card=${post?.slug}`).emit(
      "post_visible_like_update",
      addLike,
      socket?.id!,
      postId
    );
    return { addLike };
  }

  static async togglePostShare(postId: string, uid: string) {
    const data = { userId: uid, postId };
    const share = await prisma.postShare.findUnique({
      where: { userId_postId: data },
    });
    let addShare = false;
    if (share == null) {
      await prisma.postShare.create({ data });
      addShare = true;
    } else {
      await prisma.postShare.delete({
        where: {
          userId_postId: data,
        },
      });
      addShare = false;
    }
    const post = await prisma.post.findFirst({
      where: { id: postId },
      select: { slug: true },
    });
    const socket = await getUserSocket(uid);
    io.to(`post_card=${post?.slug}`).emit(
      "post_visible_share_update",
      addShare,
      socket?.id!,
      postId
    );
    return { addShare };
  }

  static async uploadCoverImage(
    stream: internal.Readable,
    info: busboy.FileInfo,
    bytes: number,
    slug: string,
    socketId?: string
  ): Promise<{ key: string; blur: string }> {
    if (
      !info.mimeType.startsWith("image/jpeg") &&
      !info.mimeType.startsWith("image/jpg") &&
      !info.mimeType.startsWith("image/png") &&
      !info.mimeType.startsWith("image/avif") &&
      !info.mimeType.startsWith("image/heic")
    ) {
      throw new Error("Input is not an image, or is of an unsupported format.");
    }
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { imageKey: true },
    });
    if (post) {
      if (post.imageKey) {
        await new Promise<void>((resolve, reject) => {
          S3.deleteObject(
            {
              Bucket: "prisma-socialmedia",
              Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + post.imageKey}`,
            },
            (e, _) => {
              if (e) reject(e);
              resolve();
            }
          );
        });
        await prisma.post.update({
          where: { slug },
          data: { imagePending: true },
        });
      }
    }
    const blob = await readableStreamToBlob(stream, info.mimeType, {
      onProgress: (progress) => {
        if (socketId)
          io.to(socketId).emit(
            "post_cover_image_progress",
            progress * 0.5,
            slug
          );
      },
      totalBytes: bytes,
    });
    const scaled = await imageProcessing(
      blob,
      { width: 768, height: 500 },
      true
    );
    const thumb = await imageProcessing(
      blob,
      { width: 300, height: 300 },
      true
    );
    const blur = (await imageProcessing(blob, {
      width: 14,
      height: 10,
    })) as string;
    const hasExtension = info.filename.includes(".");
    let p = 0;
    //upload the thumb first
    await new Promise<void>((resolve, reject) => {
      const key = `thumb.${slug}.${
        hasExtension ? info.filename.split(".")[0] : info.filename
      }.jpg`;
      S3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + key}`,
          Body: thumb,
          ContentType: "image/jpeg",
          ContentEncoding: "base64",
        },
        (e, _) => {
          if (e) reject(e);
          resolve();
        }
      ).on("httpUploadProgress", (e) => {
        if (!socketId) return;
        p++;
        //only send progress updates every 2nd event, otherwise it's probably too many emits
        if (p === 2) {
          p = 0;
          io.to(socketId).emit(
            "post_cover_image_progress",
            0.25 * (e.loaded / Buffer.byteLength(thumb)) + 0.5,
            slug
          );
        }
      });
    });
    return new Promise((resolve, reject) => {
      p = 0;
      const key = `${slug}.${
        hasExtension ? info.filename.split(".")[0] : info.filename
      }.jpg`;
      S3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: `${process.env.NODE_ENV !== "production" ? "dev." : "" + key}`,
          Body: scaled,
          ContentType: "image/jpeg",
          ContentEncoding: "base64",
        },
        (e, _) => {
          if (e) reject(e);
          resolve({ key, blur });
        }
      ).on("httpUploadProgress", (e) => {
        if (!socketId) return;
        p++;
        //only send progress updates every 2nd event, otherwise it's probably too many emits
        if (p === 2) {
          p = 0;
          io.to(socketId).emit(
            "post_cover_image_progress",
            0.25 * (e.loaded / Buffer.byteLength(scaled)) + 0.75,
            slug
          );
        }
      });
    });
  }

  static async coverImageComplete(slug: string, blur: string, key: string) {
    try {
      await prisma.post.update({
        where: { slug },
        data: {
          imageKey: key,
          imagePending: false,
          blur,
        },
      });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }

  static async coverImageError(slug: string) {
    try {
      await prisma.post.delete({ where: { slug } });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }
}
