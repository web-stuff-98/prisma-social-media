/**
 * Not sure why i am using Redis cache
 * 
 * queryName = The keyname you want to use to cache the data returned by your prisma query
 * queryPrisma = Your prisma query promise
 * expiration = Key expiration time in seconds, if you leave null the cached value will last forever
 *
 * Returns the data either from the redis cache, or from your query if the cache is not there.
 * caches the result from the query using the keyname provided.
 */

import prisma from "./prisma";
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
  } catch (e:any) {
    throw new Error(e);
  }
};
