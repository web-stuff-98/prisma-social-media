import busboy from "busboy";

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
    const bb = busboy({ headers: req.headers });
    req.pipe(bb);
    try {
      await MessengerDAO.uploadAttachment(
        bb,
        req.params.msgId,
        Number(req.params.bytes)
      );
      res.writeHead(200, { Connection: "close" });
      res.end();
    } catch (e) {
      req.unpipe(bb);
      res.status(400).json({ msg: `${e}` });
    }
  }
}
