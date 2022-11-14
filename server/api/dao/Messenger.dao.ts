import prisma from "../../utils/prisma";

import busboy, { Busboy } from "busboy";
import internal from "stream";

import mime from "mime-types";

import AWS from "../../utils/aws";
import { io } from "../..";
import { PrivateMessage } from "@prisma/client";

export default class MessengerDAO {
  static async sendMessage(
    message: string,
    hasAttachment: boolean | undefined,
    recipientId: string,
    senderId: string
  ) {
    if (recipientId === senderId) {
      throw new Error("You cannot message yourself");
    }
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
    io.to(`inbox=${recipientId}`).emit(
      "private_message",
      msg.id,
      msg.message,
      msg.senderId,
      msg.hasAttachment,
      msg.attachmentType || undefined,
      msg.attachmentError || undefined,
      msg.attachmentKey || undefined,
      msg.attachmentPending || undefined
    );
    io.to(`inbox=${senderId}`).emit(
      "private_message",
      msg.id,
      msg.message,
      msg.senderId,
      msg.hasAttachment,
      msg.attachmentType || undefined,
      msg.attachmentError || undefined,
      msg.attachmentKey || undefined,
      msg.attachmentPending || undefined
    );
    if(hasAttachment) {
      io.to(`inbox=${senderId}`).emit("private_message_request_attachment_upload", msg.id)
    }
  }

  static async updateMessage(id: string, message: string, uid: string) {
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
    io.to(`inbox=${msg.recipientId}`).emit(
      "private_message_update",
      id,
      message
    );
    io.to(`inbox=${msg.senderId}`).emit("private_message_update", id, message);
  }

  static async deleteMessage(id: string, uid: string) {
    let msg;
    try {
      msg = await prisma.privateMessage.findUniqueOrThrow({
        where: { id },
      });
    } catch (e) {
      throw new Error("Message does not exist");
    }
    if (msg.senderId !== uid) throw new Error("Unauthorized");
    await prisma.privateMessage.delete({
      where: { id },
    });
    io.to(`inbox=${msg.recipientId}`).emit("private_message_delete", id);
    io.to(`inbox=${msg.senderId}`).emit("private_message_delete", id);
  }

  static async deleteConversation(senderId: string, recipientId: string) {
    try {
      await prisma.privateMessage.deleteMany({
        where: { recipientId, senderId },
      });
    } catch (e) {
      throw new Error(`${e}`);
    }
  }

  static async getConversations(uid: string) {
    try {
      console.log("UID + " + uid);
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
      const messages = sentMessages
        .concat(receivedMessages)
        .sort(
          (msgA, msgB) => msgA.timestamp.getTime() - msgB.timestamp.getTime()
        );
      return messages;
    } catch (e) {
      throw new Error(`${e}`);
    }
  }

  static async uploadAttachment(bb: Busboy, messageId: string, bytes: number) {
    let message: PrivateMessage;
    try {
      message = await prisma.privateMessage.findUniqueOrThrow({
        where: { id: messageId },
      });
    } catch (e) {
      throw new Error("Could not find message to upload attachment for");
    }
    return new Promise<void>((resolve, reject) => {
      let type: "Image" | "Video" | "File" = "File";
      const s3 = new AWS.S3();
      let p = 0;
      bb.on(
        "file",
        (name: string, stream: internal.Readable, info: busboy.FileInfo) => {
          if (info.mimeType.startsWith("video/mp4")) {
            type = "Video";
          } else if (
            info.mimeType.startsWith("image/jpeg") ||
            info.mimeType.startsWith("image/jpg") ||
            info.mimeType.startsWith("image/png")
          ) {
            type = "Image";
          }
          const ext = String(mime.extension(info.mimeType));
          const key = `${messageId}.${info.filename.replace(".", "")}.${ext}`;
          console.log(key)
          s3.upload(
            {
              Bucket: "prisma-socialmedia",
              Key: key,
              Body: stream,
            },
            (e: unknown, file: unknown) => {
              if (e) failed(e);
              success(key);
            }
          ).on("httpUploadProgress", (e: AWS.S3.ManagedUpload.Progress) => {
            p++;
            //only send progress updates every 5th event, otherwise its probably too many emits
            if (p === 5) {
              p = 0;
              io.to(`inbox=${message.recipientId}`).emit(
                "private_message_attachment_progress",
                e.loaded / bytes,
                messageId
              );
              io.to(`inbox=${message.senderId}`).emit(
                "private_message_attachment_progress",
                e.loaded / bytes,
                messageId
              );
            }
          });
          bb.on("error", failed);
          async function failed(e: unknown) {
            console.error(e)
            io.to(`inbox=${message.recipientId}`).emit(
              "private_message_attachment_failed",
              messageId
            );
            io.to(`inbox=${message.senderId}`).emit(
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
            console.log("Error : " + e)
            reject(e);
          }
          async function success(key: string) {
            console.log("Success")
            io.to(`inbox=${message.recipientId}`).emit(
              "private_message_attachment_complete",
              messageId,
              type,
              key
            );
            io.to(`inbox=${message.senderId}`).emit(
              "private_message_attachment_complete",
              messageId,
              type,
              key
            );
            console.log("Success")
            await prisma.privateMessage.update({
              where: { id: messageId },
              data: {
                attachmentError: false,
                attachmentPending: false,
                attachmentType: type,
                attachmentKey: key,
              },
            });
            resolve();
          }
        }
      );
    });
  }
}
