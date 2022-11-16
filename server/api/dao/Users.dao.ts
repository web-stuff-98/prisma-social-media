import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import imageProcessing from "../../utils/imageProcessing";
import { io } from "../..";

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

  static async getUserById(id: string) {
    let user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, pfp: { select: { base64: true } } },
    });
    const out = user
      ? {
          id: user.id,
          name: user.name,
          pfp: user.pfp?.base64,
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
        pfp: { select: { base64: true } },
      },
    });
    const out = findQ[0]
      ? {
          id: findQ[0].id,
          name: findQ[0].name,
          pfp: findQ[0].pfp?.base64,
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
        base64 = await imageProcessing(data.pfp, { width: 48, height: 48 });
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
    io.to(uid).emit("user_subscription_update", {
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
