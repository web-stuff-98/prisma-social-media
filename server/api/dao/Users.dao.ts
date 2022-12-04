import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import imageProcessing from "../../utils/imageProcessing";
import { io } from "../..";
import getUserSocket from "../../utils/getUserSocket";
import { Profile } from "@prisma/client";

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
    const out = user
      ? {
          id: user.id,
          name: user.name,
          ...(user.pfp?.base64 ? { pfp: user.pfp.base64 } : {}),
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
    const out = findQ[0]
      ? {
          id: findQ[0].id,
          name: findQ[0].name,
          ...(findQ[0].pfp?.base64 ? { pfp: findQ[0].pfp.base64 } : {}),
        }
      : undefined;
    return out || undefined;
  }

  static async updateUser(uid: string, data: { name?: string; pfp?: string }) {
    if (data.name) {
      await prisma.user.update({
        where: { id: uid },
        data: {
          name: data.name,
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
    return user;
  }
}
