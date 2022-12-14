import { Request as Req, Response as Res } from "express";
import PostsDAO from "../dao/Posts.dao";

import getUserSocket from "../../utils/getUserSocket";
import busboy from "busboy";

export default class PostsController {
  static async getPage(req: Req, res: Res) {
    try {
      const data = await PostsDAO.getPage(
        Number(req.params.page),
        req.query,
        req.user?.id
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getDataForPosts(req: Req, res: Res) {
    try {
      const data = await PostsDAO.getDataForPosts(
        req.body.shares,
        req.user.id
      );
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getPostById(req: Req, res: Res) {
    try {
      const post = await PostsDAO.getPostById(req.params.id, req.user?.id);
      if (post) res.status(200).json(post);
      else res.status(404).json({ msg: "Not found" });
    } catch (e) {
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async getPostBySlug(req: Req, res: Res) {
    try {
      const post = await PostsDAO.getPostBySlug(req.params.slug, req.user?.id);
      if (post) res.status(200).json(post);
      else res.status(404).json({ msg: "Not found" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ msg: "Internal error" });
    }
  }

  static async deletePost(req: Req, res: Res) {
    try {
      await PostsDAO.deletePostBySlug(req.params.slug, req.user.id);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async createPost(req: Req, res: Res) {
    try {
      const post = await PostsDAO.createPost(
        req.body.title,
        req.body.body,
        req.body.description,
        req.body.tags,
        req.user.id
      );
      res.status(201).json({ slug: post.slug }).end();
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal Error" }).end();
    }
  }

  static async updatePost(req: Req, res: Res) {
    try {
      const post = await PostsDAO.updatePost(
        req.body.title,
        req.body.body,
        req.body.description,
        req.body.tags,
        req.user.id,
        req.params.slug
      );
      res.status(201).json(post).end();
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal Error" }).end();
    }
  }

  static async addComment(req: Req, res: Res) {
    try {
      const cmt = await PostsDAO.addComment(
        req.body.message,
        req.user.id,
        req.params.id,
        req.body.parentId,
        req.user.name
      );
      return res.status(201).json(cmt).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async updateComment(req: Req, res: Res) {
    try {
      const cmt = await PostsDAO.updateComment(
        req.body.message,
        req.params.commentId,
        req.user.id
      );
      if (!cmt) {
        return res.status(403).json({ msg: "Unauthorized" }).end();
      }
      return res.status(200).json(cmt).end();
    } catch (e) {
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async deleteComment(req: Req, res: Res) {
    try {
      const cmt = await PostsDAO.deleteComment(
        req.params.commentId,
        req.user.id
      );
      if (!cmt) {
        return res.status(403).json({ msg: "Unauthorized" }).end();
      }
      return res.status(200).json(cmt).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async toggleCommentLike(req: Req, res: Res) {
    try {
      const like = await PostsDAO.toggleCommentLike(
        req.params.commentId,
        req.user.id
      );
      return res.status(200).json(like).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async togglePostLike(req: Req, res: Res) {
    try {
      const like = await PostsDAO.togglePostLike(
        req.params.id,
        req.user.id
      );
      return res.status(200).json(like).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  static async togglePostShare(req: Req, res: Res) {
    try {
      const share = await PostsDAO.togglePostShare(
        req.params.id,
        req.user.id
      );
      return res.status(200).json(share).end();
    } catch (e) {
      console.error(e);
      return res.status(500).json({ msg: "Internal Error" });
    }
  }

  // messy crap ahead
  static async uploadCoverImage(req: Req, res: Res) {
    /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
        inside the Chat DAO for some reason. I wrote the same code in my other project and it
        worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
        anymore because it doesn't make sense and I can't fix it */
    let post;
    let gotFile = false;
    try {
      post = await PostsDAO.getPostBySlug(req.params.slug);
    } catch (e) {
      res
        .status(400)
        .json({ msg: "Could not find post to upload attachment for" });
    }
    if (post?.authorId) {
      if (post.authorId !== req.user?.id) throw new Error("Unauthorized");
    }
    const bb = busboy({
      headers: req.headers,
      limits: { files: 1, fields: 0, fileSize: 10000000 },
    });
    bb.on("file", async (_, stream, info) => {
      try {
        gotFile = true;
        const socket = await getUserSocket(req.user?.id!);
        const { key, blur } = await PostsDAO.uploadCoverImage(
          stream,
          info,
          Number(req.params.bytes),
          req.params.slug,
          socket!.id
        );
        await PostsDAO.coverImageComplete(req.params.slug, blur, key);
        res.writeHead(201, { Connection: "close" });
        res.end();
      } catch (error) {
        req.unpipe(bb)
        return res.status(500).json({ msg: "Internal error" });
      }
    });
    bb.on("finish", () => {
      if (!gotFile) {
        req.unpipe(bb);
        res.status(400).json({ msg: "No file!" });
      }
    });
    bb.on("error", async (e: unknown) => {
      await PostsDAO.coverImageError(req.params.slug);
      req.unpipe(bb);
      res.status(400).json({ msg: `${e}` });
    });
    req.pipe(bb);
  }
}
