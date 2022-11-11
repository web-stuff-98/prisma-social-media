import { io } from "../..";
import prisma from "../../utils/prisma";
import redisClient from "../../utils/redis";

import busboy, { Busboy } from "busboy";
import internal from "stream";

/**
 * Messenger specific socket.io event listener functions
 */

export default class MessengerDAO {
  static async sendMessage(
    message: string,
    hasAttachment: boolean | undefined,
    recipientId: string,
    senderId: string
  ) {
    hasAttachment ? await prisma.privateMessage.create({
      data: {
        message,
        senderId,
        recipientId,
        attachmentType: undefined,
        attachmentPending: true,
        attachmentError: false,
      },
    }) || await prisma.privateMessage.create({
      data: {
        message,
        senderId,
        recipientId,
        attachmentType: undefined,
        attachmentError: false,
        attachmentPending: false,
      },
    }) 
  }

  static async uploadAttachment(bb: Busboy, messageId: string, bytes: number) {
    let type: "Image" | "Video" | "File" = "File";
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
        //stuff here
      }
    );
  }
}
