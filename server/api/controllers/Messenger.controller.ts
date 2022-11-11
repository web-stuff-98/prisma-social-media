import busboy from "busboy";

import { Request as Req, Response as Res } from "express";
import MessengerDAO from "../dao/Messenger.dao";

export default class MessengerController {
  static async uploadAttachment(req: Req, res: Res) {
    const bb = busboy({ headers: req.headers as any });
    req.pipe(bb);
    try {
      await MessengerDAO.uploadAttachment(
        bb,
        req.params.msgId,
        Number(req.params.bytes)
      );
    } catch (e) {
      req.unpipe(bb);
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async sendMessage(req: Req, res: Res) {
    try {
      const { message, recipientId, attachmentPending } = req.body;
      await MessengerDAO.sendMessage(
        message,
        attachmentPending,
        recipientId,
        String(req.user?.id)
      );
    } catch (e) {}
  }
}
