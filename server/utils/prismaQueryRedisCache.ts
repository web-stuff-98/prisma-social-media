/**
 * Caches prisma query results using redis cache and a custom keyname, either gets the value from
 * redis or gets the value by running the prisma query if its not cached already.
 * Not being used anymore
 * 
 * queryName = The keyname you want to use to cache the data returned by your prisma query
 * queryPrisma = Your prisma query promise
 * expiration = Key expiration time in seconds, if you leave null the cached value will last forever
 */

import redisClient from "./redis";

export default async (
  queryName: string,
  queryPrisma: Promise<any>,
  expiration: number | undefined = undefined
) => {
  try {
    const getQ = await redisClient.get(`query-cache:${queryName}`);
    if (!getQ) {
      const data = await queryPrisma
      const dataJSON = JSON.stringify(data);
      if (!expiration) {
        await redisClient.set(`query-cache:${queryName}`, dataJSON);
      } else {
        await redisClient.set(
          `query-cache:${queryName}`,
          dataJSON,
          "EX",
          expiration
        );
      }
      return data;
    } else {
      return JSON.parse(getQ);
    }
  } catch (e:unknown) {
    throw new Error(`${e}`);
  }
};
