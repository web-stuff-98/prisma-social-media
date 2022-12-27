import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import imageProcessing from "../../utils/imageProcessing";
import { io } from "../..";
import getUserSocket from "../../utils/getUserSocket";
import redisClient from "../../utils/redis";
import AWS from "../../utils/aws";
import busboy from "busboy";
import internal from "stream";
import readableStreamToBlob from "../../utils/readableStreamToBlob";
const S3 = new AWS.S3();

export default class UsersDAO {
  static async getUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return users;
  }

  static async getProfile(uid: string, currentUserId?: string) {
    try {
      const profile = await prisma.profile.findUniqueOrThrow({
        where: { userId: uid },
      });
      const shares = await prisma.post.findMany({
        where: { shares: { some: { userId: uid } } },
        select: { slug: true },
      });
      return { profileData: profile, shares: shares.map((s) => s.slug) };
    } catch (e) {
      throw new Error(
        currentUserId && currentUserId === uid
          ? "You have no profile"
          : "User has no profile"
      );
    }
  }

  static async updateProfile(uid: string, bio: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId: uid },
    });
    if (profile)
      await prisma.profile.update({
        where: { userId: uid },
        data: { bio },
      });
    else
      await prisma.profile.create({
        data: {
          userId: uid,
          bio,
        },
      });
    io.to(`profile=${uid}`).emit("profile_update", { bio });
  }

  static async updateProfileImage(
    uid: string,
    stream: internal.Readable,
    info: busboy.FileInfo
  ) {
    if (
      !info.mimeType.startsWith("image/jpeg") &&
      !info.mimeType.startsWith("image/jpg") &&
      !info.mimeType.startsWith("image/png") &&
      !info.mimeType.startsWith("image/avif") &&
      !info.mimeType.startsWith("image/heic")
    ) {
      throw new Error("Input is not an image, or is of an unsupported format.");
    }
    const blob = await readableStreamToBlob(stream, info.mimeType);
    const scaled = (await imageProcessing(blob, {
      width: 136,
      height: 33,
    })) as string;
    const matchingProfile = await prisma.profile.findUnique({
      where: { userId: uid },
    });
    if (matchingProfile) {
      await prisma.profile.update({
        where: { userId: uid },
        data: {
          backgroundBase64: scaled,
        },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: uid,
          backgroundBase64: scaled,
        },
      });
    }
    io.to(`profile=${uid}`).emit("profile_update", {
      backgroundBase64: scaled,
    });
  }

  static async getUserById(id: string) {
    let user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        pfp: { select: { base64: true } },
      },
    });
    const socket = await getUserSocket(id);
    const out = user
      ? {
          id: user.id,
          name: user.name,
          ...(user.pfp?.base64 ? { pfp: user.pfp.base64 } : {}),
          online: socket ? true : false,
        }
      : undefined;
    return out;
  }

  static async getUserByName(name: string) {
    const findQ = await prisma.user.findMany({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        pfp: { select: { base64: true } },
      },
    });
    if (!findQ[0]) return undefined;
    const socket = await getUserSocket(findQ[0].id);
    const out = findQ[0]
      ? {
          id: findQ[0].id,
          name: findQ[0].name,
          online: socket ? true : false,
          ...(findQ[0].pfp?.base64 ? { pfp: findQ[0].pfp.base64 } : {}),
        }
      : undefined;
    return out;
  }

  static async updatePfp(
    uid: string,
    stream: internal.Readable,
    info: busboy.FileInfo
  ) {
    if (
      !info.mimeType.startsWith("image/jpeg") &&
      !info.mimeType.startsWith("image/jpg") &&
      !info.mimeType.startsWith("image/png") &&
      !info.mimeType.startsWith("image/avif") &&
      !info.mimeType.startsWith("image/heic")
    ) {
      throw new Error("Input is not an image, or is of an unsupported format.");
    }
    const blob = await readableStreamToBlob(stream, info.mimeType);
    const scaled = (await imageProcessing(blob, {
      width: 48,
      height: 48,
    })) as string;
    const matchingPfp = await prisma.pfp.findUnique({ where: { userId: uid } });
    if (matchingPfp) {
      await prisma.pfp.update({
        where: { userId: uid },
        data: {
          base64: scaled,
        },
      });
    } else {
      await prisma.pfp.create({
        data: {
          userId: uid,
          base64: scaled,
        },
      });
    }
    io.to(`user=${uid}`).emit("user_visible_update", {
      id: uid,
      pfp: scaled,
    });
  }

  static async createUser(username: string, password: string) {
    const foundName = await prisma.user.findFirst({
      where: { name: { equals: username.trim(), mode: "insensitive" } },
      select: { id: true },
    });
    if (foundName) throw new Error("There is a user with that name already");
    const passHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: username,
        password: passHash,
      },
      select: {
        id: true,
        name: true,
      },
    });
    const keyVal = await redisClient.get("deleteAccountsCountdownList");
    let deleteAccountsCountdownList = [
      { id: user.id, deleteAt: new Date(Date.now() + 1200000).toISOString() },
    ];
    if (keyVal)
      deleteAccountsCountdownList = [
        ...deleteAccountsCountdownList,
        ...(JSON.parse(keyVal) as any[]),
      ];
    await redisClient.set(
      "deleteAccountsCountdownList",
      JSON.stringify(deleteAccountsCountdownList)
    );
    return user;
  }

  static async deleteUser(id: string) {
    // delete all the users post images
    const posts = await prisma.post.findMany({
      where: { authorId: id, imagePending: false },
    });
    for await (const post of posts) {
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          {
            Key: `${
              (process.env.NODE_ENV !== "production" ? "dev." : "") +
              post.imageKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          {
            Key: `${process.env.NODE_ENV !== "production" ? "dev." : ""}thumb.${
              post.imageKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    // delete all the users attachments
    const roomMessages = await prisma.roomMessage.findMany({
      where: { senderId: id, hasAttachment: true },
    });
    for await (const msg of roomMessages) {
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          {
            Key: `${
              (process.env.NODE_ENV !== "production" ? "dev." : "") +
              msg.attachmentKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    const privateMessages = await prisma.roomMessage.findMany({
      where: { senderId: id, hasAttachment: true },
    });
    for await (const msg of privateMessages) {
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          {
            Key: `${
              (process.env.NODE_ENV !== "production" ? "dev." : "") +
              msg.attachmentKey
            }`,
            Bucket: "prisma-socialmedia",
          },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
    //everything else is deleted automatically via SQL cascade
    await prisma.user.delete({ where: { id } });
  }
}
