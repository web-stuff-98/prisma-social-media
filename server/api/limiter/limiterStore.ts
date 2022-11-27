/**
 * All the functions used to access data by the rate limiting middleware stored on Redis.
 **/

import redisClient from "../../utils/redis";
import { BruteRateLimitParams } from "./limiters";

export interface IPBlockInfo {
  ip: string;
  bruteRateLimitData?: BruteRateLimitData[];
  simpleRateLimitWindowData?: SimpleRateLimitWindowData[];
  simpleRateLimitBlocks?: SimpleRateLimitBlockInfo[];
}
export type SimpleRateLimitBlockInfo = {
  routeName: string;
  blockedAt: string; //js date converted to iso date string
  blockDuration: number;
};
export type BruteRateLimitBlockInfo = SimpleRateLimitBlockInfo & {
  failTimes: number; // the number of fails (fails are added when you call bruteFail)
  maxFailTimes: number;
};
export type SimpleRateLimitWindowData = {
  routeName: string;
  timestamp: string;
  windowDuration: number;
  maxReqs: number;
  reqs: number;
};
export type BruteRateLimitData = {
  attempts: number;
  lastAttempt: string;
} & Omit<BruteRateLimitParams, "msg">;

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

const addIPBlockInfo = (info: IPBlockInfo) =>
  redisClient.set(`ip-info:${info.ip}`, JSON.stringify(info));

const updateIPBlockInfo = (info: Partial<IPBlockInfo>, original: IPBlockInfo) =>
  redisClient.set(
    `ip-info:${original.ip}`,
    JSON.stringify({
      ...original,
      ...info,
    })
  );

export const prepBruteRateLimit = async (
  params: Omit<BruteRateLimitParams, "msg">,
  ip: string
) => {
  const found = await findIPBlockInfo(ip);
  if (!found) {
    await addIPBlockInfo({
      ip,
      bruteRateLimitData: [
        {
          ...params,
          attempts: 0,
          lastAttempt: "",
        },
      ],
    });
  } else {
    const i = found.bruteRateLimitData
      ? found.bruteRateLimitData?.findIndex(
          (data) => data.routeName === params.routeName
        )
      : -1;
    let bruteRateLimitData: BruteRateLimitData[] =
      found.bruteRateLimitData || [];
    if (i === -1) {
      await updateIPBlockInfo(
        {
          bruteRateLimitData: [
            ...bruteRateLimitData,
            {
              ...params,
              attempts: 0,
              lastAttempt: "",
            },
          ],
        },
        found
      );
    }
  }
};

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

export {
  findIPBlockInfo,
  addSimpleRateLimiterBlock,
  addIPBlockInfo,
  updateIPBlockInfo,
};
