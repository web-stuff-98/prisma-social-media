import { PrivateMessage, Room, RoomMessage } from "@prisma/client";
import Busboy from "busboy";

import { Request as Req, Response as Res } from "express";
import ChatDAO from "../dao/Chat.dao";

export default class ChatController {
  static async searchUser(req: Req, res: Res) {
    try {
      const users = await ChatDAO.searchUser(req.params.name);
      res.status(200).json(users);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async sendPrivateMessage(req: Req, res: Res) {
    try {
      await ChatDAO.sendPrivateMessage(
        req.body.message,
        req.body.hasAttachment,
        req.body.recipientId,
        req.user.id
      );
      res.status(201).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async updatePrivateMessage(req: Req, res: Res) {
    try {
      await ChatDAO.updatePrivateMessage(
        req.body.messageId,
        req.body.message,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async deletePrivateMessage(req: Req, res: Res) {
    try {
      await ChatDAO.deletePrivateMessage(
        req.body.messageId,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async sendInvite(req: Req, res: Res) {
    try {
      await ChatDAO.inviteUser(
        req.body.recipientId,
        req.user.id,
        req.body.roomName
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async acceptInvite(req: Req, res: Res) {
    try {
      await ChatDAO.acceptInvite(
        req.user.id,
        req.body.senderId,
        req.body.roomName
      ),
        res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async declineInvite(req: Req, res: Res) {
    try {
      await ChatDAO.declineInvite(
        req.user.id,
        req.body.senderId,
        req.body.roomName
      ),
        res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getConversations(req: Req, res: Res) {
    try {
      const users = await ChatDAO.getConversations(req.user.id);
      res.status(200).json(users).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getConversation(req: Req, res: Res) {
    try {
      const messages = await ChatDAO.getConversation(
        req.params.uid,
        req.user.id
      );
      res.status(200).json(messages).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async deleteConversation(req: Req, res: Res) {
    try {
      await ChatDAO.deleteConversation(req.user.id, req.params.uid);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  // messy crap ahead
  static async uploadPrivateMessageAttachment(req: Req, res: Res) {
    /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
    inside the Chat DAO for some reason. I wrote the same code in my other project and it
    worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
    anymore because it doesn't make sense and I can't fix it */
    let message: PrivateMessage;
    let gotFile = false;
    try {
      message = await ChatDAO.getPrivateMessage(req.params.msgId);
    } catch (e) {
      res.status(400).json({ msg: "Could not find message for attachment" });
    }
    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fields: 0, fileSize: 500000000 },
    });
    req.pipe(bb);
    bb.on("file", async (_, stream, info) => {
      let successData = { key: "", type: "" };
      gotFile = true;
      try {
        successData = await ChatDAO.uploadConversationAttachment(
          stream,
          info,
          message,
          Number(req.params.bytes)
        );
      } catch (e) {
        req.unpipe(bb);
        await ChatDAO.conversationAttachmentError(
          message.senderId!,
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
      await ChatDAO.conversationAttachmentComplete(
        message.senderId!,
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
          req.unpipe(bb);
          res.status(400).json({ msg: `${e}` });
        });
    });
    bb.on("finish", async () => {
      if (!gotFile) {
        await ChatDAO.conversationAttachmentError(
          message.senderId!,
          message.recipientId,
          message.id
        );
        res.status(400).json({ msg: "No file!" });
      }
    });
    bb.on("error", async (e: unknown) => {
      await ChatDAO.conversationAttachmentError(
        message.senderId!,
        message.recipientId,
        message.id
      )
        .then(() => {
          req.unpipe(bb);
          res.status(400).json({ msg: `${e}` });
        })
        .catch((e) => {
          req.unpipe(bb);
          res
            .status(500)
            .json({ msg: `${e}` })
            .end();
        });
    });
  }

  static async conversationOpenVideoChat(req: Req, res: Res) {
    try {
      await ChatDAO.conversationOpenVideoChat(
        req.user.id,
        req.params.uid
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  // Rooms
  static async getRooms(req: Req, res: Res) {
    try {
      const users = await ChatDAO.getRooms();
      res.status(200).json(users).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getRoom(req: Req, res: Res) {
    try {
      const room = await ChatDAO.getRoomById(req.params.roomId);
      res.status(200).json(room).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getRoomMessages(req: Req, res: Res) {
    try {
      const messages = await ChatDAO.getRoomMessages(req.params.roomId);
      res.status(200).json(messages).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async createRoom(req: Req, res: Res) {
    try {
      const { name } = req.body;
      const foundRoom = await ChatDAO.getRoomByName(name);
      if (foundRoom) {
        if (foundRoom.authorId === req.user?.id) {
          return res
            .status(400)
            .json({ msg: "You already have a room by that name" })
            .end();
        }
      }
      const room = await ChatDAO.createRoom(name, req.user.id);
      res.status(201).json(room);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async updateRoom(req: Req, res: Res) {
    try {
      if (req.body.name) {
        const foundRoom = await ChatDAO.getRoomByName(req.body.name);
        if (foundRoom?.authorId === req.user?.id) {
          return res
            .status(400)
            .json({
              message:
                "You already have a room by that name. Rename the other room first or choose a different name.",
            })
            .end();
        }
      }
      await ChatDAO.updateRoom(
        req.params.roomId,
        req.body as Partial<Pick<Room, "name" | "public">>
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async deleteRoom(req: Req, res: Res) {
    try {
      await ChatDAO.deleteRoom(req.params.roomId, req.user.id);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async joinRoom(req: Req, res: Res) {
    try {
      await ChatDAO.joinRoom(req.params.roomId, req.user.id);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async leaveRoom(req: Req, res: Res) {
    try {
      await ChatDAO.leaveRoom(req.params.roomId, req.user.id);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async banUser(req: Req, res: Res) {
    try {
      await ChatDAO.banUser(
        req.params.roomId,
        req.params.banUid,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async unbanUser(req: Req, res: Res) {
    try {
      await ChatDAO.unbanUser(
        req.params.roomId,
        req.params.unbanUid,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async kickUser(req: Req, res: Res) {
    try {
      await ChatDAO.kickUser(
        req.params.roomId,
        req.params.kickUid,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async sendRoomMessage(req: Req, res: Res) {
    try {
      await ChatDAO.sendRoomMessage(
        req.body.message,
        req.body.hasAttachment,
        req.user.id,
        req.body.roomId
      );
      res.status(201).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async updateRoomMessage(req: Req, res: Res) {
    try {
      await ChatDAO.updateRoomMessage(
        req.body.messageId,
        req.body.message,
        req.user.id
      );
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async deleteRoomMessage(req: Req, res: Res) {
    try {
      await ChatDAO.deleteRoomMessage(req.body.messageId, req.user.id);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async getRoomUsers(req: Req, res: Res) {
    try {
      const uids = await ChatDAO.getRoomUsers(req.params.roomId);
      res.status(200).json(uids);
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }

  static async uploadRoomMessageAttachment(req: Req, res: Res) {
    /* This is messy and breaks the design pattern because busboy.on("file") wouldn't fire from
    inside the Chat DAO for some reason. I wrote the same code in my other project and it
    worked on the first try (webrtc-chat-js). I gave up after trying for 3 + 2 + 3 days and I don't care
    anymore because it doesn't make sense and I can't fix it */
    let message: RoomMessage;
    let gotFile = false;
    try {
      message = await ChatDAO.getRoomMessage(req.params.msgId);
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
      gotFile = true;
      try {
        successData = await ChatDAO.uploadRoomAttachment(
          stream,
          info,
          message,
          Number(req.params.bytes)
        );
      } catch (e) {
        req.unpipe(bb);
        await ChatDAO.roomAttachmentError(message.roomId, message.id)
          .then(() => res.status(400).json({ msg: `${e}` }))
          .catch((e) =>
            res
              .status(500)
              .json({ msg: `${e}` })
              .end()
          );
      }
      await ChatDAO.roomAttachmentComplete(
        message.roomId,
        message.id,
        successData.type,
        successData.key
      )
        .then(() => {
          res.writeHead(201, { Connection: "close" });
          res.end();
        })
        .catch((e) => {
          req.unpipe(bb);
          res.status(400).json({ msg: `${e}` });
        });
    });
    bb.on("finish", async () => {
      if (!gotFile) {
        await ChatDAO.roomAttachmentError(message.roomId, message.id);
        res.status(400).json({ msg: "No file!" });
      }
    });
    bb.on("error", async (e: unknown) => {
      await ChatDAO.roomAttachmentError(message.roomId, message.id)
        .then(() => {
          req.unpipe(bb);
          res.status(400).json({ msg: `${e}` });
        })
        .catch((e) => {
          req.unpipe(bb);
          res
            .status(500)
            .json({ msg: `${e}` })
            .end();
        });
    });
  }

  static async roomOpenVideoChat(req: Req, res: Res) {
    try {
      await ChatDAO.roomOpenVideoChat(req.user.id, req.params.roomId);
      res.status(200).end();
    } catch (e) {
      res.status(400).json({ msg: `${e}` });
    }
  }
}
