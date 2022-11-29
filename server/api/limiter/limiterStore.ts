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

/**
 * look through all the block data for the IP to find out what the
 * expiration date for the key should be. returns ms to expiry.
 */
const getExpirationDateFromIPBlockInfo = (info: IPBlockInfo) => {
  let latestBlockEnd = Date.now();
  if (info.bruteRateLimitData) {
    info.bruteRateLimitData.forEach((data) => {
      const blockEnd =
        new Date(data.lastAttempt).getTime() +
        data.blockDuration *
          Math.max(
            data.failsRequired * Math.ceil(data.attempts / data.failsRequired),
            1
          );
      if (blockEnd > latestBlockEnd) latestBlockEnd = blockEnd;
    });
  }
  if (info.simpleRateLimitBlocks) {
    info.simpleRateLimitBlocks.forEach((data) => {
      const blockEnd = new Date(data.blockedAt).getTime() + data.blockDuration;
      if (blockEnd > latestBlockEnd) latestBlockEnd = blockEnd;
    });
  }
  if (info.simpleRateLimitWindowData) {
    info.simpleRateLimitWindowData.forEach((data) => {
      const end = new Date(data.timestamp).getTime() + data.windowDuration;
      if (end > latestBlockEnd) latestBlockEnd = end;
    });
  }
  return latestBlockEnd - Date.now();
};

const addIPBlockInfo = (info: IPBlockInfo) => {
  const expiration = getExpirationDateFromIPBlockInfo(info);
  redisClient.set(`ip-info:${info.ip}`, JSON.stringify(info), "PX", expiration);
};

const updateIPBlockInfo = async (
  info: Partial<IPBlockInfo>,
  original: IPBlockInfo
) => {
  const data = {
    ...original,
    ...info,
  };
  const expiration = getExpirationDateFromIPBlockInfo(data);
  await redisClient.set(
    `ip-info:${original.ip}`,
    JSON.stringify(data),
    "PX",
    expiration
  );
};

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
      const data = {
        ...found,
        simpleRateLimitBlocks: [simpleBlockData],
      } as IPBlockInfo;
      const expiration = getExpirationDateFromIPBlockInfo(data);
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify(data),
        "PX",
        expiration
      );
    }
    const simpleBlockInfoIndex = found.simpleRateLimitBlocks.findIndex(
      (block) => block.routeName === simpleBlockData.routeName
    );
    let simpleRateLimitBlocks = found.simpleRateLimitBlocks;
    if (simpleBlockInfoIndex !== -1) {
      simpleRateLimitBlocks[simpleBlockInfoIndex].blockedAt =
        new Date().toISOString();
      const data = {
        ...found,
        simpleRateLimitBlocks,
      } as IPBlockInfo;
      const expiration = getExpirationDateFromIPBlockInfo(data);
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify(data),
        "PX",
        expiration
      );
    } else {
      simpleRateLimitBlocks.push(simpleBlockData);
      const data = {
        ...found,
        simpleRateLimitBlocks,
      } as IPBlockInfo;
      const expiration = getExpirationDateFromIPBlockInfo(data);
      return await redisClient.set(
        `ip-info:${ip}`,
        JSON.stringify(data),
        "PX",
        expiration
      );
    }
  } else {
    const data = {
      ip,
      simpleRateLimitBlocks: [simpleBlockData],
    } as IPBlockInfo;
    const expiration = getExpirationDateFromIPBlockInfo(data);
    await redisClient.set(
      `ip-info:${ip}`,
      JSON.stringify(data),
      "PX",
      expiration
    );
  }
};

export {
  findIPBlockInfo,
  addSimpleRateLimiterBlock,
  addIPBlockInfo,
  updateIPBlockInfo,
};
