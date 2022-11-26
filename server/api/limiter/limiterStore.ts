/**
 * All the functions used to access data by the rate limiting middleware stored on Redis.
 **/

import redisClient from "../../utils/redis";

export interface IPBlockInfo {
  ip: string;
  simpleRateLimitWindowData?: SimpleRateLimitWindowData[]; //
  simpleRateLimitBlocks?: SimpleRateLimitBlockInfo[];
  bruteRateLimitBlocks?: BruteRateLimitBlockInfo[];
}
export type SimpleRateLimitBlockInfo = {
  routeName: string;
  blockedAt: string; //js date converted to iso date string
  blockDuration: number;
};
export type BruteRateLimitBlockInfo = SimpleRateLimitBlockInfo & {
  failTimes: number;
};
export type SimpleRateLimitWindowData = {
  routeName: string;
  timestamp: string;
  windowDuration: number;
  maxReqs: number;
  reqs: number;
};

const findIPBlockInfo = (ip: string): Promise<IPBlockInfo | undefined> =>
  new Promise((resolve, reject) =>
    redisClient.get(`ip-info:${ip}`, (e, data) => {
      e
        ? reject(e)
        : resolve(
            data ? (JSON.parse(data as string) as IPBlockInfo) : undefined
          );
    })
  );

const addIPBlockInfo = async (info:IPBlockInfo) => {
  await redisClient.set(`ip-info:${info.ip}`, JSON.stringify(info))
}

const updateIPBlockInfo = async (info:Partial<IPBlockInfo>, original:IPBlockInfo) => {
  await redisClient.set(`ip-info:${info.ip}`, JSON.stringify({
    ...original,
    ...info,
  }))
}

const addSimpleRateLimiterBlock = async (
  ip: string,
  simpleBlockData: SimpleRateLimitBlockInfo
) => {
  const found = (await findIPBlockInfo(ip)) as IPBlockInfo;
  if (found) {
    if (!found.simpleRateLimitBlocks) {
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify({
          ...found,
          simpleRateLimitBlocks: [simpleBlockData],
        } as IPBlockInfo)
      );
    }
    const simpleBlockInfoIndex = found.simpleRateLimitBlocks.findIndex(
      (block) => block.routeName === simpleBlockData.routeName
    );
    let simpleRateLimitBlocks = found.simpleRateLimitBlocks;
    if (simpleBlockInfoIndex !== -1) {
      simpleRateLimitBlocks[simpleBlockInfoIndex].blockedAt =
        new Date().toISOString();
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify({
          ...found,
          simpleRateLimitBlocks,
        } as IPBlockInfo)
      );
    } else {
      simpleRateLimitBlocks.push(simpleBlockData);
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify({
          ...found,
          simpleRateLimitBlocks,
        } as IPBlockInfo)
      );
    }
  } else {
    await redisClient.set(
      `ip-info:${ip}`,
      JSON.stringify({
        ip,
        simpleRateLimitBlocks: [simpleBlockData],
      } as IPBlockInfo)
    );
  }
};

export { findIPBlockInfo, addSimpleRateLimiterBlock, addIPBlockInfo, updateIPBlockInfo };
