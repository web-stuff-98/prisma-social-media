import prisma from "../../utils/prisma";
import prismaQueryRedisCache from "../../utils/prismaQueryRedisCache";

import bcrypt from "bcrypt";

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
    const user = await prismaQueryRedisCache(
      `user:${id}`,
      prisma.user.findUnique({
        where: { id },
      }),
      30
    );
    return user;
  }

  static async getUserByName(name: string) {
    const findQ = await prisma.user.findMany({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });
    return findQ[0] || undefined;
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
