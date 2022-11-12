import prisma from "../../utils/prisma";

import busboy, { Busboy } from "busboy";
import internal from "stream";

import mime from "mime-types";

import AWS from "../../utils/aws";
import { io } from "../..";
import { PrivateMessage } from "@prisma/client";
import getUserSocket from "../../utils/getUserSocket";

export default class MessengerDAO {
  static async sendMessage(
    message: string,
    hasAttachment: boolean | undefined,
    recipientId: string,
    senderId: string
  ) {
    hasAttachment
      ? await prisma.privateMessage.create({
          data: {
            message,
            senderId,
            recipientId,
            attachmentType: undefined,
            attachmentPending: true,
            attachmentError: false,
          },
        })
      : await prisma.privateMessage.create({
          data: {
            message,
            senderId,
            recipientId,
            attachmentType: undefined,
            attachmentError: false,
            attachmentPending: false,
          },
        });
  }

  static async offerAcceptFriendship(
    senderId: string,
    recipientId: string
  ){
    
  }

  static async denyCancelFriendship(
    denierUid: string,
    deniedUid: string
  ) {

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
    const senderSocket = await getUserSocket(message.senderId);
    const recipientSocket = await getUserSocket(message.recipientId);
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
            info.mimeType.startsWith("image/png")
          ) {
            type = "Image";
          }
          const ext = String(mime.extension(info.mimeType));
          const key = `${messageId}.${info.filename}.${ext}`;
          console.log(`Uploading file to S3 with key : ${key}`);
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
            //only send progress updates every 3rd event, otherwise its too many emits
            if (p === 3) {
              p = 0;
              io.to(recipientSocket.id).emit(
                "private_message_attachment_progress",
                e.loaded / bytes,
                messageId
              );
              io.to(senderSocket.id).emit(
                "private_message_attachment_progress",
                e.loaded / bytes,
                messageId
              );
            }
          });
          bb.on("error", failed);
          async function failed(e: unknown) {
            io.to(recipientSocket.id).emit(
              "private_message_attachment_failed",
              messageId
            );
            io.to(senderSocket.id).emit(
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
            reject(e);
          }
          async function success(key: string) {
            io.to(recipientSocket.id).emit(
              "private_message_attachment_complete",
              messageId,
              type
            );
            io.to(senderSocket.id).emit(
              "private_message_attachment_complete",
              messageId,
              type
            );
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
