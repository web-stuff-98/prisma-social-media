import prisma from "../../utils/prisma";

import busboy from "busboy";
import internal from "stream";

import mime from "mime-types";

import AWS from "../../utils/aws";
import { io } from "../..";
import { PrivateMessage, RoomMessage, Room } from "@prisma/client";
import getUserSocket from "../../utils/getUserSocket";

export default class ChatDAO {
  static async searchUser(name: string) {
    /*
    You could easily make this function faster, couldn't be bothered to figure out the proper way of doing it at the time
    It also returns the user making the search, which it maybe shouldn't do
    */
    const inQ = await prisma.user
      .findMany({
        where: {
          name: {
            in: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      })
      .then((res) => res.map((u) => u.id));
    const startsWithQ = await prisma.user
      .findMany({
        where: {
          name: {
            startsWith: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      })
      .then((res) => res.map((u) => u.id));
    const endsWithQ = await prisma.user
      .findMany({
        where: {
          name: {
            startsWith: name,
            mode: "insensitive",
          },
        },
        select: { id: true },
      })
      .then((res) => res.map((u) => u.id));
    const a = inQ.concat(startsWithQ).concat(endsWithQ);
    return a.filter((item, pos) => a.indexOf(item) == pos);
  }

  //Conversations(priate messaging)
  static async sendPrivateMessage(
    message: string,
    hasAttachment: boolean | undefined,
    recipientId: string,
    senderId: string
  ) {
    if (recipientId === senderId)
      throw new Error("You cannot message yourself");
    const msg = hasAttachment
      ? await prisma.privateMessage.create({
          data: {
            message,
            senderId,
            recipientId,
            hasAttachment: true,
            attachmentPending: true,
          },
        })
      : await prisma.privateMessage.create({
          data: {
            message,
            senderId,
            recipientId,
            hasAttachment: false,
            attachmentError: false,
            attachmentPending: false,
          },
        });
    io.to(`inbox=${recipientId}`).emit("private_message", {
      id: msg.id,
      message: msg.message,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      hasAttachment: msg.hasAttachment,
      attachmentPending: msg.attachmentPending || null,
      attachmentKey: msg.attachmentKey || null,
      attachmentError: msg.attachmentError || null,
      attachmentType: msg.attachmentType || null,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    });
    io.to(`inbox=${senderId}`).emit("private_message", {
      id: msg.id,
      message: msg.message,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      hasAttachment: msg.hasAttachment,
      attachmentPending: msg.attachmentPending || null,
      attachmentKey: msg.attachmentKey || null,
      attachmentError: msg.attachmentError || null,
      attachmentType: msg.attachmentType || null,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    });
    if (hasAttachment) {
      io.to(`inbox=${senderId}`).emit(
        "private_message_request_attachment_upload",
        msg.id
      );
    }
  }

  static async updatePrivateMessage(id: string, message: string, uid: string) {
    let msg;
    try {
      msg = await prisma.privateMessage.findUniqueOrThrow({
        where: { id },
      });
    } catch (e) {
      throw new Error("Message does not exist");
    }
    if (msg.senderId !== uid) throw new Error("Unauthorized");
    await prisma.privateMessage.update({
      where: { id },
      data: {
        message,
      },
    });
    io.to(`inbox=${msg.recipientId}`).emit("private_message_update", {
      id,
      message,
    });
    io.to(`inbox=${msg.senderId}`).emit("private_message_update", {
      id,
      message,
    });
  }

  static async deletePrivateMessage(id: string, uid: string) {
    let msg: PrivateMessage;
    try {
      msg = await prisma.privateMessage.findUniqueOrThrow({
        where: { id },
      });
    } catch (e) {
      throw new Error("Message does not exist");
    }
    if (msg.senderId !== uid) throw new Error("Unauthorized");
    if (msg.hasAttachment) {
      const s3 = new AWS.S3();
      await new Promise<void>((resolve, reject) =>
        s3.deleteObject(
          {
            Bucket: "prisma-socialmedia",
            Key: String(msg.attachmentKey),
          },
          (err, data) => {
            if (err) reject(err);
            resolve();
          }
        )
      );
    }
    await prisma.privateMessage.delete({
      where: { id },
    });
    io.to(`inbox=${msg.recipientId}`).emit("private_message_delete", id);
    io.to(`inbox=${msg.senderId}`).emit("private_message_delete", id);
  }

  static async deleteConversation(senderId: string, recipientId: string) {
    io.to(`inbox=${recipientId}`).emit(
      "private_conversation_deleted",
      senderId
    );
    io.to(`inbox=${senderId}`).emit(
      "private_conversation_deleted",
      recipientId
    );
    const toDelete = await prisma.privateMessage.findMany({
      where: { recipientId, senderId },
      select: { attachmentKey: true },
    });
    const s3 = new AWS.S3();
    for await (const msg of Array.from(toDelete)) {
      return new Promise<void>((resolve, reject) =>
        s3.deleteObject(
          {
            Bucket: "prisma-socialmedia",
            Key: String(msg.attachmentKey),
          },
          (err, data) => {
            if (err) reject(err);
            resolve();
          }
        )
      );
    }
    await prisma.privateMessage.deleteMany({
      where: { recipientId, senderId },
    });
  }

  static async getConversations(uid: string) {
    try {
      const sentMessages = await prisma.privateMessage.findMany({
        where: { senderId: uid },
      });
      const receivedMessages = await prisma.privateMessage.findMany({
        where: { recipientId: uid },
      });
      let uids: string[] = [];
      for (const msg of sentMessages) {
        if (!uids.includes(msg.recipientId) && msg.recipientId !== uid)
          uids.push(msg.recipientId);
      }
      for (const msg of receivedMessages) {
        if (!uids.includes(msg.senderId) && msg.senderId !== uid)
          uids.push(msg.senderId);
      }
      const users = await prisma.user.findMany({
        where: { id: { in: uids } },
        select: { id: true },
      });
      return users;
    } catch (e) {
      console.error(e);
      throw new Error("Internal error");
    }
  }

  static async getConversation(recipientId: string, uid: string) {
    try {
      const sentMessages = await prisma.privateMessage.findMany({
        where: { senderId: uid, recipientId },
      });
      const receivedMessages = await prisma.privateMessage.findMany({
        where: { senderId: recipientId, recipientId: uid },
      });
      return sentMessages
        .concat(receivedMessages)
        .sort(
          (msgA, msgB) => msgA.createdAt.getTime() - msgB.createdAt.getTime()
        );
    } catch (e) {
      throw new Error(`${e}`);
    }
  }

  static async getPrivateMessage(msgId: string) {
    return await prisma.privateMessage.findUniqueOrThrow({
      where: { id: msgId },
    });
  }

  /**
   * Breaks the design principle I know, i explained why I did it this
   * way in the route controller file
   */
  static async uploadConversationAttachment(
    stream: internal.Readable,
    info: busboy.FileInfo,
    message: PrivateMessage,
    bytes: number
  ): Promise<{ key: string; type: string }> {
    return new Promise((resolve, reject) => {
      let type: "Image" | "Video" | "File" = "File";
      const s3 = new AWS.S3();
      let p = 0;
      if (info.mimeType.startsWith("video/mp4")) {
        type = "Video";
      } else if (
        info.mimeType.startsWith("image/jpeg") ||
        info.mimeType.startsWith("image/jpg") ||
        info.mimeType.startsWith("image/png")
      ) {
        type = "Image";
      }
      const hasExtension = info.filename.includes(".");
      const ext = String(mime.extension(info.mimeType));
      const key = `${message.id}.${
        hasExtension ? info.filename.split(".")[0] : info.filename
      }.${ext}`;
      s3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: key,
          Body: stream,
        },
        (e: unknown, file: unknown) => {
          if (e) reject(e);
          resolve({ key, type });
        }
      ).on("httpUploadProgress", (e: AWS.S3.ManagedUpload.Progress) => {
        p++;
        //only send progress updates every 2nd event, otherwise it's probably too many emits
        if (p === 2) {
          p = 0;
          io.to(`inbox=${message.recipientId}`).emit(
            "private_message_attachment_progress",
            e.loaded / bytes,
            message.id
          );
          io.to(`inbox=${message.senderId}`).emit(
            "private_message_attachment_progress",
            e.loaded / bytes,
            message.id
          );
        }
      });
    });
  }

  static async conversationAttachmentError(
    senderId: string,
    recipientId: string,
    messageId: string
  ) {
    try {
      io.to(`inbox=${recipientId}`).emit(
        "private_message_attachment_failed",
        messageId
      );
      io.to(`inbox=${senderId}`).emit(
        "private_message_attachment_failed",
        messageId
      );
      await prisma.privateMessage.update({
        where: { id: messageId },
        data: {
          attachmentError: true,
          attachmentPending: false,
        },
      });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }

  static async conversationAttachmentComplete(
    senderId: string,
    recipientId: string,
    messageId: string,
    type: string,
    key: string
  ) {
    try {
      io.to(`inbox=${recipientId}`).emit(
        "private_message_attachment_complete",
        messageId,
        type,
        key
      );
      io.to(`inbox=${senderId}`).emit(
        "private_message_attachment_complete",
        messageId,
        type,
        key
      );
      await prisma.privateMessage.update({
        where: { id: messageId },
        data: {
          hasAttachment: true,
          attachmentError: false,
          attachmentPending: false,
          attachmentType: type,
          attachmentKey: key,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }

  //Rooms
  static async getRooms() {
    return await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        authorId: true,
        members: { select: { id: true } },
        banned: { select: { id: true } },
        public: true,
      },
    });
  }

  static async getRoomById(id: string) {
    return await prisma.room.findUnique({
      where: { id },
      select: {
        authorId: true,
        id: true,
        name: true,
        members: { select: { id: true } },
        banned: { select: { id: true } },
        public: true,
      },
    });
  }

  static async getRoomByName(name: string) {
    return await prisma.room.findFirst({
      where: { name },
      select: {
        authorId: true,
        id: true,
        name: true,
        members: { select: { id: true } },
        banned: { select: { id: true } },
        public: true,
      },
    });
  }

  static async getRoomMessages(id: string) {
    let room;
    try {
      room = await prisma.room.findUniqueOrThrow({
        where: { id },
        select: { messages: true },
      });
    } catch (e) {
      throw new Error("Room does not exist");
    }
    return room.messages;
  }

  static async deleteRoom(roomId: string, uid: string) {
    const matchingRoom = await prisma.room.findFirst({
      where: { id: roomId, authorId: uid },
    });
    if (!matchingRoom)
      throw new Error("You either do not own the room, or it does not exist");
    await prisma.room.delete({
      where: { id: roomId },
    });
    io.emit("room_deleted", roomId);
    return roomId;
  }

  static async createRoom(name: string, authorId: string) {
    const roomAlreadyExists = await prisma.room.findFirst({
      where: {
        authorId,
        name,
      },
    });
    if (roomAlreadyExists)
      throw new Error("You already have a room by that name");
    const usersRooms = await prisma.room.findMany({
      where: { authorId },
      select: { _count: true },
    });
    if (usersRooms.length > 8) throw new Error("Max 8 rooms");
    const room = await prisma.room.create({
      data: {
        authorId,
        name,
        members: { connect: { id: authorId } },
      },
      include: {
        members: { select: { id: true } },
        banned: { select: { id: true } },
      },
    });
    io.emit("room_created", room);
  }

  static async joinRoom(roomId: string, uid: string) {
    let room;
    room = await prisma.room
      .findUniqueOrThrow({
        where: { id: roomId },
        include: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      })
      .catch((e) => {
        throw new Error("Room does not exist");
      });
    if (!room.public)
      throw new Error("You need an invitation to join this room");
    if (room.banned.find((banned) => banned.id === uid))
      throw new Error("You are banned from this room");
    await prisma.room.update({
      where: { id: roomId },
      data: { members: { connect: { id: uid } } },
    });
    const user = await prisma.user.findFirst({
      where: { id: uid },
      select: { name: true },
    });
    const serverMessage = await prisma.roomMessage.create({
      data: {
        message: `${user?.name} has joined the room`,
        hasAttachment: false,
        roomId,
      },
    });
    io.to(`room=${roomId}`).emit("room_message", {
      id: serverMessage.id,
      roomId,
      message: serverMessage.message,
      senderId: "",
      hasAttachment: false,
      attachmentPending: null,
      attachmentKey: null,
      attachmentError: null,
      attachmentType: null,
      createdAt: serverMessage.createdAt,
      updatedAt: serverMessage.updatedAt,
    });
    const usersSocket = await getUserSocket(uid);
    if (usersSocket) usersSocket.join(`room=${roomId}`);
  }

  static async banUser(roomId: string, bannedUid: string, bannerUid: string) {
    let room;
    if (bannedUid === bannerUid) throw new Error("You cannot ban yourself");
    room = await prisma.room
      .findUniqueOrThrow({
        where: { id: roomId },
        include: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      })
      .catch((e) => {
        throw new Error("Room does not exist");
      });
    if (room.authorId !== bannerUid)
      throw new Error("Only the rooms owner can ban other users");
    if (room.banned.find((banned) => banned.id === bannedUid))
      throw new Error("You have already banned this user");
    await prisma.room.update({
      where: { id: roomId },
      data: {
        banned: { connect: { id: bannedUid } },
        members: { disconnect: { id: bannedUid } },
      },
    });
    const bannedUser = await prisma.user.findFirst({
      where: { id: bannedUid },
      select: { name: true },
    });
    const bannerUser = await prisma.user.findFirst({
      where: { id: bannerUid },
      select: { name: true },
    });
    const serverMessage = await prisma.roomMessage.create({
      data: {
        message: `${bannedUser?.name} was banned from the room by ${bannerUser?.name}`,
        hasAttachment: false,
        roomId,
      },
    });
    io.to(`room=${roomId}`).emit("room_message", {
      id: serverMessage.id,
      roomId,
      message: serverMessage.message,
      senderId: "",
      hasAttachment: false,
      attachmentPending: null,
      attachmentKey: null,
      attachmentError: null,
      attachmentType: null,
      createdAt: serverMessage.createdAt,
      updatedAt: serverMessage.updatedAt,
    });
    const usersSocket = await getUserSocket(bannedUid);
    if (usersSocket) {
      usersSocket.leave(`room=${roomId}`);
      usersSocket.data.vidChatOpen = false;
      io.to(`room=${roomId}`).emit(
        "room_video_chat_user_left",
        String(usersSocket.data.user?.id)
      );
    }
    io.emit("room_updated", {
      ...room,
      banned: [...room.banned, { id: bannedUid }],
      members: room.members.filter((obj) => obj.id !== bannedUid),
    });
  }

  static async unbanUser(roomId: string, bannedUid: string, bannerUid: string) {
    let room;
    if (bannedUid === bannerUid) throw new Error("You cannot unban yourself");
    room = await prisma.room
      .findUniqueOrThrow({
        where: { id: roomId },
        include: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      })
      .catch((e) => {
        throw new Error("Room does not exist");
      });
    if (room.authorId !== bannerUid)
      throw new Error("Only the rooms owner can unban users");
    if (!room.banned.find((banned) => banned.id === bannedUid))
      throw new Error("This user is not banned");
    await prisma.room.update({
      where: { id: roomId },
      data: {
        banned: { disconnect: { id: bannedUid } },
      },
    });
    const bannedUser = await prisma.user.findFirst({
      where: { id: bannedUid },
      select: { name: true },
    });
    const bannerUser = await prisma.user.findFirst({
      where: { id: bannerUid },
      select: { name: true },
    });
    const serverMessage = await prisma.roomMessage.create({
      data: {
        message: `${bannedUser?.name} was unbanned by ${bannerUser?.name}`,
        hasAttachment: false,
        roomId,
      },
    });
    io.to(`room=${roomId}`).emit("room_message", {
      id: serverMessage.id,
      roomId,
      message: serverMessage.message,
      senderId: "",
      hasAttachment: false,
      attachmentPending: null,
      attachmentKey: null,
      attachmentError: null,
      attachmentType: null,
      createdAt: serverMessage.createdAt,
      updatedAt: serverMessage.updatedAt,
    });
    const usersSocket = await getUserSocket(bannedUid);
    if (usersSocket) {
      usersSocket.leave(`room=${roomId}`);
      usersSocket.data.vidChatOpen = false;
      io.to(`room=${roomId}`).emit(
        "room_video_chat_user_left",
        String(usersSocket.data.user?.id)
      );
    }
    io.emit("room_updated", {
      ...room,
      banned: room.banned.filter((obj) => obj.id !== bannedUid),
    });
  }

  static async kickUser(roomId: string, kickedUid: string, kickerUid: string) {
    let room;
    if (kickedUid === kickerUid) throw new Error("You cannot kick yourself");
    room = await prisma.room
      .findUniqueOrThrow({
        where: { id: roomId },
        include: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      })
      .catch((e) => {
        throw new Error("Room does not exist");
      });
    if (room.authorId !== kickerUid)
      throw new Error("Only the rooms owner can kick other users");
    if (!room.members.find((u) => u.id === kickedUid))
      throw new Error("The user you want to kick isn't joined to the room");
    if (room.banned.find((banned) => banned.id === kickedUid))
      throw new Error("That user is already banned from the room");
    await prisma.room.update({
      where: { id: roomId },
      data: {
        members: { disconnect: { id: kickedUid } },
      },
    });
    const kickedUser = await prisma.user.findFirst({
      where: { id: kickedUid },
      select: { name: true },
    });
    const kickerUser = await prisma.user.findFirst({
      where: { id: kickerUid },
      select: { name: true },
    });
    const serverMessage = await prisma.roomMessage.create({
      data: {
        message: `${kickedUser?.name} was kicked from the room by ${kickerUser?.name}`,
        hasAttachment: false,
        roomId,
      },
    });
    await prisma.room.update({
      where: { id: roomId },
      data: { members: { disconnect: { id: kickedUid } } },
    });
    io.to(`room=${roomId}`).emit("room_message", {
      id: serverMessage.id,
      roomId,
      message: serverMessage.message,
      senderId: "",
      hasAttachment: false,
      attachmentPending: null,
      attachmentKey: null,
      attachmentError: null,
      attachmentType: null,
      createdAt: serverMessage.createdAt,
      updatedAt: serverMessage.updatedAt,
    });
    const usersSocket = await getUserSocket(kickedUid);
    if (usersSocket) {
      usersSocket.leave(`room=${roomId}`);
      usersSocket.data.vidChatOpen = false;
      io.to(`room=${roomId}`).emit(
        "room_video_chat_user_left",
        String(usersSocket.data.user?.id)
      );
    }
    io.emit("room_updated", {
      members: room.members.filter((m) => m.id !== kickedUid),
    });
  }

  static async leaveRoom(roomId: string, uid: string) {
    await prisma.room
      .findUniqueOrThrow({
        where: { id: roomId },
        include: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      })
      .catch((e) => {
        throw new Error("Room does not exist");
      });
    const user = await prisma.user.findFirst({
      where: { id: uid },
      select: { name: true },
    });
    const serverMessage = await prisma.roomMessage.create({
      data: {
        message: `${user?.name} has left the room`,
        hasAttachment: false,
        roomId,
      },
    });
    io.to(`room=${roomId}`).emit("room_message", {
      id: serverMessage.id,
      roomId,
      message: serverMessage.message,
      senderId: "",
      hasAttachment: false,
      attachmentPending: null,
      attachmentKey: null,
      attachmentError: null,
      attachmentType: null,
      createdAt: serverMessage.createdAt,
      updatedAt: serverMessage.updatedAt,
    });
    const usersSocket = await getUserSocket(uid);
    if (usersSocket) {
      usersSocket.leave(`room=${roomId}`);
      usersSocket.data.vidChatOpen = false;
      io.to(`room=${roomId}`).emit(
        "room_video_chat_user_left",
        String(usersSocket.data.user?.id)
      );
    }
  }

  static async getRoomMessage(msgId: string) {
    return await prisma.roomMessage.findUniqueOrThrow({
      where: { id: msgId },
    });
  }

  static async sendRoomMessage(
    message: string,
    hasAttachment: boolean | undefined,
    senderId: string,
    roomId: string
  ) {
    const msg = hasAttachment
      ? await prisma.roomMessage.create({
          data: {
            message,
            senderId,
            roomId,
            hasAttachment: true,
            attachmentPending: true,
          },
        })
      : await prisma.roomMessage.create({
          data: {
            message,
            senderId,
            roomId,
            hasAttachment: false,
            attachmentError: false,
            attachmentPending: false,
          },
        });
    io.to(`room=${roomId}`).emit("room_message", {
      id: msg.id,
      roomId,
      message: msg.message,
      senderId: msg.senderId,
      hasAttachment: msg.hasAttachment,
      attachmentPending: msg.attachmentPending || null,
      attachmentKey: msg.attachmentKey || null,
      attachmentError: msg.attachmentError || null,
      attachmentType: msg.attachmentType || null,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    });
    if (hasAttachment) {
      io.to(`room=${roomId}`).emit(
        "room_message_request_attachment_upload",
        msg.id
      );
    }
  }

  static async updateRoomMessage(id: string, message: string, uid: string) {
    let msg;
    try {
      msg = await prisma.roomMessage.findUniqueOrThrow({
        where: { id },
      });
    } catch (e) {
      throw new Error("Message does not exist");
    }
    if (msg.senderId !== uid) throw new Error("Unauthorized");
    await prisma.roomMessage.update({
      where: { id },
      data: {
        message,
      },
    });
    io.to(`room=${msg.roomId}`).emit("room_message_update", id, {
      message,
    });
  }

  static async updateRoom(
    roomId: string,
    data: Partial<Pick<Room, "name" | "public">>
  ) {
    await prisma.room.update({
      where: { id: roomId },
      data,
    });
    io.emit("room_updated", { id: roomId, ...data });
  }

  static async getRoomUsers(roomId: string) {
    try {
      const room = await prisma.room.findUniqueOrThrow({
        where: { id: roomId },
        select: {
          banned: { select: { id: true } },
          members: { select: { id: true } },
        },
      });
      return {
        banned: room.banned.map((obj) => obj.id),
        members: room.members.map((obj) => obj.id),
      };
    } catch (e) {
      throw new Error("Room does not exist");
    }
  }

  static async deleteRoomMessage(id: string, uid: string) {
    let msg: RoomMessage;
    try {
      msg = await prisma.roomMessage.findUniqueOrThrow({
        where: { id },
      });
    } catch (e) {
      throw new Error("Message does not exist");
    }
    if (msg.senderId !== uid) throw new Error("Unauthorized");
    if (msg.hasAttachment) {
      const s3 = new AWS.S3();
      await new Promise<void>((resolve, reject) =>
        s3.deleteObject(
          {
            Bucket: "prisma-socialmedia",
            Key: String(msg.attachmentKey),
          },
          (err, data) => {
            if (err) reject(err);
            resolve();
          }
        )
      );
    }
    await prisma.roomMessage.delete({
      where: { id },
    });
    io.to(`room=${msg.roomId}`).emit("room_message_delete", id);
  }

  static async uploadRoomAttachment(
    stream: internal.Readable,
    info: busboy.FileInfo,
    message: RoomMessage,
    bytes: number
  ): Promise<{ key: string; type: string }> {
    return new Promise((resolve, reject) => {
      let type: "Image" | "Video" | "File" = "File";
      const s3 = new AWS.S3();
      let p = 0;
      if (info.mimeType.startsWith("video/mp4")) {
        type = "Video";
      } else if (
        info.mimeType.startsWith("image/jpeg") ||
        info.mimeType.startsWith("image/jpg") ||
        info.mimeType.startsWith("image/png")
      ) {
        type = "Image";
      }
      const hasExtension = info.filename.includes(".");
      const ext = String(mime.extension(info.mimeType));
      const key = `${message.id}.${
        hasExtension ? info.filename.split(".")[0] : info.filename
      }.${ext}`;
      s3.upload(
        {
          Bucket: "prisma-socialmedia",
          Key: key,
          Body: stream,
        },
        (e: unknown, file: unknown) => {
          if (e) reject(e);
          resolve({ key, type });
        }
      ).on("httpUploadProgress", (e: AWS.S3.ManagedUpload.Progress) => {
        p++;
        //only send progress updates every 2nd event, otherwise it's probably too many emits
        if (p === 2) {
          p = 0;
          io.to(`room=${message.roomId}`).emit(
            "room_message_attachment_progress",
            e.loaded / bytes,
            message.id
          );
        }
      });
    });
  }

  static async roomAttachmentComplete(
    roomId: string,
    messageId: string,
    type: string,
    key: string
  ) {
    try {
      io.to(`room=${roomId}`).emit(
        "room_message_attachment_complete",
        messageId,
        type,
        key
      );
      await prisma.roomMessage.update({
        where: { id: messageId },
        data: {
          hasAttachment: true,
          attachmentError: false,
          attachmentPending: false,
          attachmentType: type,
          attachmentKey: key,
        },
      });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }

  static async roomAttachmentError(roomId: string, messageId: string) {
    try {
      io.to(`room=${roomId}`).emit("room_message_attachment_failed", messageId);
      await prisma.roomMessage.update({
        where: { id: messageId },
        data: {
          attachmentError: true,
          attachmentPending: false,
        },
      });
    } catch (e) {
      console.warn(e);
      throw new Error("Internal error handling error :-(");
    }
  }

  static async roomOpenVideoChat(uid: string, roomId: string) {
    const socket = await getUserSocket(uid);
    if (!socket) throw new Error("User has no socket connection");
    const sids = (await io.in(`room=${roomId}`).fetchSockets())
      .filter((s) => s.data.vidChatOpen)
      .map((s) => ({ sid: s.id, uid: s.data.user.id }))
      .filter((ids) => ids.sid !== socket.id);
    socket.data.vidChatOpen = true;
    socket.emit("room_video_chat_all_users", sids);
  }
}
