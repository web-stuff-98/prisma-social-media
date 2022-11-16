import { PrivateMessage } from "@prisma/client";
import Busboy from "busboy";

import { Request as Req, Response as Res } from "express";
import MessengerDAO from "../dao/Messenger.dao";

export default class MessengerController {
  static async getConversations(req: Req, res: Res) {
    try {
      const users = await MessengerDAO.getConversations(String(req.user?.id));
      res.status(200).json(users).end();
    } catch (e) {
      res.status(500).json({ msg: `${e}` });
    }
  }

  static async getConversation(req: Req, res: Res) {
    try {
      const messages = await MessengerDAO.getConversation(
        req.params.uid,
        String(req.user?.id)
      );
      res.status(200).json(messages).end();
    } catch (e) {
      res.status(500).json({ msg: `${e}` });
    }
  }

  static async deleteConversation(req: Req, res: Res) {
    try {
      await MessengerDAO.deleteConversation(
        String(req.user?.id),
        req.params.uid
      );
      res.status(200).end();
    } catch (e) {
      res.status(500).json({ msg: `${e}` });
    }
  }

  static async uploadAttachment(req: Req, res: Res) {
    /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
    inside the Messenger DAO for some reason. It doesn't make any sense because it worked in my
    other project (webrtc-chat-js). I gave up after wasting my time trying for 3 days.
    It will have to remain messy, which doesn't actually matter because it works fine. */
    let message: PrivateMessage;
    try {
      message = await MessengerDAO.getMessage(req.params.msgId);
    } catch (error) {
      res
        .status(400)
        .json({ msg: "Could not find message to upload attachment for" });
    }
    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fields: 0, fileSize: 500000000 },
    });
    req.pipe(bb);
    let gotFile = false;
    let successData = { key: "", type: "", recipientId: "" };
    bb.on("file", async (name, stream, info) => {
      gotFile = true;
      try {
        successData = await MessengerDAO.uploadAttachment(
          stream,
          info,
          message,
          Number(req.params.bytes)
        );
      } catch (e) {
        req.unpipe(bb);
        await MessengerDAO.attachmentError(
          message.senderId,
          message.recipientId,
          message.id
        );
        res.status(400).json({ msg: `${e}` });
      }
    });
    bb.on("finish", async () => {
      if (!gotFile) {
        await MessengerDAO.attachmentError(
          message.senderId,
          message.recipientId,
          message.id
        );
        res.status(400).json({ msg: "No file sent" });
      } else {
        await MessengerDAO.attachmentComplete(
          message.senderId,
          successData.recipientId,
          req.params.msgId,
          successData.type,
          successData.key
        );
        res.writeHead(201, { Connection: "close" });
        res.end();
      }
    });
    bb.on("error", async (e: unknown) => {
      console.warn(`${e}`);
      await MessengerDAO.attachmentError(
        message.senderId,
        message.recipientId,
        message.id
      );
      req.unpipe(bb);
      res.status(500).json({ msg: "Internal error" });
    });
  }
}
