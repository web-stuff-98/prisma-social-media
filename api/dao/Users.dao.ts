import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import imageProcessing from "../../utils/imageProcessing";
import { io } from "../..";
import getUserSocket from "../../utils/getUserSocket";
import redisClient from "../../utils/redis";
import AWS from "../../utils/aws";
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
      return profile;
    } catch (e) {
      throw new Error(
        currentUserId && currentUserId === uid
          ? "You have no profile"
          : "User has no profile"
      );
    }
  }

  static async updateProfile(
    uid: string,
    data: { backgroundBase64?: string; bio?: string }
  ) {
    let backgroundScaled = "";
    let updateData = data;
    if (data.backgroundBase64) {
      backgroundScaled = (await imageProcessing(data.backgroundBase64!, {
        width: 136,
        height: 33,
      })) as string;
      updateData.backgroundBase64 = backgroundScaled;
    }
    if (updateData.backgroundBase64 === "") delete updateData.backgroundBase64;
    const profile = await prisma.profile.findUnique({
      where: { userId: uid },
    });
    if (profile)
      await prisma.profile.update({
        where: { userId: uid },
        data: updateData,
      });
    else
      await prisma.profile.create({
        data: {
          userId: uid,
          ...updateData,
        },
      });
    io.to(`profile=${uid}`).emit("profile_update", data);
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

  static async updateUser(uid: string, data: { name?: string; pfp?: string }) {
    if (data.name) {
      const foundName = await prisma.user.findFirst({
        where: { name: { equals: data.name.trim(), mode: "insensitive" } },
      });
      if (foundName) throw new Error("There is a user with that name already");
      await prisma.user.update({
        where: { id: uid },
        data: {
          name: data.name.trim(),
        },
      });
    }
    let base64;
    if (data.pfp) {
      try {
        base64 = (await imageProcessing(data.pfp, {
          width: 48,
          height: 48,
        })) as string;
      } catch (e) {
        throw new Error(`Error processing image : ${e}`);
      }
      const matchingPfp = await prisma.pfp.findUnique({
        where: { userId: uid },
      });
      if (matchingPfp) {
        await prisma.pfp.update({
          where: { userId: uid },
          data: {
            base64,
          },
        });
      } else {
        await prisma.pfp.create({
          data: {
            userId: uid,
            base64,
          },
        });
      }
    }
    if (data.name) {
      const socket = await getUserSocket(uid);
      if (socket) socket.data.user.name = data.name;
    }
    io.to(`user=${uid}`).emit("user_visible_update", {
      id: uid,
      ...(data.name ? { name: data.name } : {}),
      ...(data.pfp ? { pfp: base64 } : {}),
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
          { Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + post.imageKey}`, Bucket: "prisma-socialmedia" },
          (err, _) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
      await new Promise<void>((resolve, reject) => {
        S3.deleteObject(
          { Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "")}thumb.${post.imageKey}`, Bucket: "prisma-socialmedia" },
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
          { Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + msg.attachmentKey}`, Bucket: "prisma-socialmedia" },
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
          { Key: `${(process.env.NODE_ENV !== "production" ? "dev." : "") + msg.attachmentKey}`, Bucket: "prisma-socialmedia" },
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
