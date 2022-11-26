/**
 * All the functions used to access data by the rate limiting middleware.
 **/

/**
 * IPBlockInfo is the interface storing all the data related to rate limiting and specific
 * users IPs, currently data for each IP stored globally in an array and accessed using JS
 * array find methods. I will move it to redis.
 */
export interface IPBlockInfo {
  ip: string;
  simpleRateLimitWindowData?: SimpleRateLimitWindowData[]; //
  simpleRateLimitBlocks?: SimpleRateLimitBlockInfo[];
  bruteRateLimitBlocks?: BruteRateLimitBlockInfo[];
}
//let blockedIPsInfo: IPBlockInfo[] = [];
export type SimpleRateLimitBlockInfo = {
  routeName: string;
  blockedAt: string; //js date converted to iso date string
  blockDuration: number;
};
export type BruteRateLimitBlockInfo = SimpleRateLimitBlockInfo & {
  failTimes: number;
  /* ^ failTimes counts the number of fails which is used to calculate
  the cooldown period :
  (duration * min(4, max(1, number of fails)))
  4 is the default max number of fails to multiply duration by */
};
export type SimpleRateLimitWindowData = {
  routeName: string;
  timestamp: string; //time of first request in window. js date converted to iso date string.
  windowDuration: number;
  maxReqs: number;
  reqs: number;
};

const findIPBlockInfo = (ip: string) =>
  blockedIPsInfo.find((info) => info.ip === ip);
const findIPBlockInfoIndex = (ip: string) =>
  blockedIPsInfo.findIndex((info) => info.ip === ip);
const addSimpleRateLimiterBlock = (
  ip: string,
  info: SimpleRateLimitBlockInfo
) => {
  const i = blockedIPsInfo.findIndex((info) => info.ip === ip);
  if (i !== -1) {
    const found = blockedIPsInfo[i];
    if (!found.simpleRateLimitBlocks) {
      found.simpleRateLimitBlocks = [info];
      return;
    }
    const foundSimpleBlockIndex = found.simpleRateLimitBlocks.findIndex(
      (block) => block.routeName === info.routeName
    );
    if (foundSimpleBlockIndex !== -1) {
      found.simpleRateLimitBlocks[i].blockedAt = new Date().toISOString();
    } else {
      found.simpleRateLimitBlocks?.push(info);
    }
  } else {
    blockedIPsInfo.push({ ip, simpleRateLimitBlocks: [info] });
  }
};

export { findIPBlockInfo, findIPBlockInfoIndex, addSimpleRateLimiterBlock }