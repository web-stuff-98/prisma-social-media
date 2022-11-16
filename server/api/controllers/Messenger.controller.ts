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
    inside the Messenger DAO for some reason. I wrote the same code in my other project and it
    worked on the first try (webrtc-chat-js). I gave up after trying for 3 days and I don't care
    anymore because it doesn't make sense and I can't fix it */
    let message: PrivateMessage;
    try {
      message = await MessengerDAO.getMessage(req.params.msgId);
    } catch (e) {
      res.status(400).json({ msg: "Could not find message for attachment" });
    }
    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fields: 0, fileSize: 500000000 },
    });
    req.pipe(bb);
    bb.on("file", async (name, stream, info) => {
      let successData = { key: "", type: "" };
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
        )
          .then(() => res.status(400).json({ msg: `${e}` }))
          .catch((e) =>
            res
              .status(500)
              .json({ msg: `${e}` })
              .end()
          );
      }
      await MessengerDAO.attachmentComplete(
        message.senderId,
        message.recipientId,
        req.params.msgId,
        successData.type,
        successData.key
      )
        .then(() => {
          res.writeHead(201, { Connection: "close" });
          res.end();
        })
        .catch((e) => {
          req.unpipe(bb)
          res.status(500).json({ msg: "Internal error" })
        })
    });
    bb.on("error", async (e: unknown) => {
      await MessengerDAO.attachmentError(
        message.senderId,
        message.recipientId,
        message.id
      )
        .then(() => res.status(400).json({ msg: `${e}` }))
        .catch((e) =>
          res
            .status(500)
            .json({ msg: `${e}` })
            .end()
        ).finally(() =>
          req.unpipe(bb)
        )
    });
  }
}
