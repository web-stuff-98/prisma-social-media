import { Request as Req, Response as Res, NextFunction } from "express";

/**
 * My rate limiters
 *
 * simpleRateLimit   <- For really simple rate limiting, block an IP on
 *                      a specific route for a certain amount of time
 *                      if they make too many requests in a given time
 *                      window. Could improve.
 */

import {
  findIPBlockInfo,
  addSimpleRateLimiterBlock,
  IPBlockInfo,
  BruteRateLimitBlockInfo,
  SimpleRateLimitWindowData,
  addIPBlockInfo,
  updateIPBlockInfo,
} from "./limiterStore";

import getReqIp from "../../utils/getReqIp";

const checkBlockedBySimpleOrBruteBlock = async ({
  info,
  mode,
  checkBruteCooldown,
  routeName = "any",
}: {
  info: IPBlockInfo;
  mode: "simple" | "brute";
  checkBruteCooldown?: boolean;
  routeName: "any" | string;
}) => {
  const key = `${mode}RateLimitBlocks` as keyof Pick<
    IPBlockInfo,
    "simpleRateLimitBlocks" | "bruteRateLimitBlocks"
  >;
  let isBlocked = false;
  const hasKey = info[key] ? true : false;
  let i = 0;
  /* iterate through all the stored block information to check for active blocks
  matching the routeName */
  if (hasKey)
    while (isBlocked === false && i < info[key]!.length - 1) {
      i++;
      if (routeName === "any" || info[key]![i].routeName === routeName) {
        const blockedAt = new Date(info[key]![i].blockedAt);
        let blockEnd;
        if (!checkBruteCooldown) {
          blockEnd = blockedAt.getTime() + info[key]![i].blockDuration;
        } else {
          if (mode !== "brute") {
            throw new Error("checkBruteCooldown is used only with brute mode");
          }
          const item = info[key]![i] as BruteRateLimitBlockInfo;
          blockEnd =
            blockedAt.getTime() +
            item.blockDuration * Math.max(2, item.failTimes);
        }
        if (Date.now() < blockEnd) isBlocked = true;
      }
    }
  return isBlocked;
};

/**
 * This isn't used anymore, because the rate limiter
 * is using redis now. I am just keeping it here to
 * remind me that I need to set up expiration dates
 * for the keys.
 */
export const ipBlockCleanupInterval = async () => {
  const i = setInterval(() => {
    let cleanupIps = [];
    blockedIPsInfo.forEach(async (info) => {
      if (
        (await checkBlockedBySimpleOrBruteBlock({
          info,
          mode: "simple",
          routeName: "any",
        })) ||
        (await checkBlockedBySimpleOrBruteBlock({
          info,
          mode: "brute",
          checkBruteCooldown: true,
          routeName: "any",
        }))
      ) {
        cleanupIps.push(info.ip);
      }
    });
    blockedIPsInfo;
  }, 1000);
  return () => clearInterval(i);
};

export type SimpleRateLimitParams = {
  maxReqs?: number;
  windowMs?: number;
  msg?: string;
  routeName: string;
  blockDuration: number;
};

/**
 * simpleRateLimit is for specific api routes. Refuses the IP if they
 * have made more than n requests within the time window. This is used
 * for stopping messenger spam for example.
 *
 * "routeName" should be the API route path as it is in the router, for
 * example "room/:roomId/message". req.url is used automatically as
 * a fallback but routeName should always be set MANUALLY for ALL API
 * routes that have query params! Otherwise you will be rate limiting
 * for specific pages and ids and so on, which is not its intended
 * behaviour
 *
 * parameters:
 *  maxReqs? = maximum number of requests in time window
 *  windowMs? = timewindow measured in ms
 *  duration? = number of milliseconds the client is blocked for
 *  msg? = the message sent back
 *  routeName = the express route, example : room/:roomId/message/like
 */
export const simpleRateLimit = (
  params: SimpleRateLimitParams = {
    maxReqs: 10,
    windowMs: 1000,
    msg: "Too many requests",
    routeName: "",
    blockDuration: 5000,
  }
) => {
  return async (req: Req, res: Res, next: NextFunction) => {
    const routeName = params.routeName === "" ? req.path : params.routeName;
    const ip = getReqIp(req);
    const ipBlockInfo = await findIPBlockInfo(ip);
    if (ipBlockInfo) {
      const blocked = await checkBlockedBySimpleOrBruteBlock({
        info: ipBlockInfo,
        mode: "simple",
        routeName,
      });
      if (blocked) return res.status(429).json({ msg: params.msg }).end();
    }
    if (await simpleRateLimitTrigger(ip, params)) {
      await addSimpleRateLimiterBlock(ip, {
        routeName: params.routeName,
        blockedAt: new Date().toISOString(),
        blockDuration: params.blockDuration,
      });
      return res.status(429).json({ msg: params.msg }).end();
    }
    next();
  };
};

/** This is called only for simpleRateLimit and only if the ip isn't already blocked.
 * It returns true if the ip should be blocked by the middleware
 * **/
const simpleRateLimitTrigger = async (
  ip: string,
  params: SimpleRateLimitParams
): Promise<boolean> => {
  const ipBlockInfo = await findIPBlockInfo(ip);
  if (!ipBlockInfo) {
    await addIPBlockInfo({
      ip,
      simpleRateLimitWindowData: [
        {
          routeName: params.routeName,
          timestamp: new Date().toISOString(),
          windowDuration: Number(params.windowMs),
          maxReqs: Number(params.maxReqs),
          reqs: 1,
        },
      ],
    });
    return false;
  }
  if (!ipBlockInfo.simpleRateLimitWindowData) {
    await updateIPBlockInfo(
      {
        simpleRateLimitWindowData: [
          {
            routeName: params.routeName,
            timestamp: new Date().toISOString(),
            windowDuration: Number(params.windowMs),
            maxReqs: Number(params.maxReqs),
            reqs: 1,
          },
        ],
      },
      ipBlockInfo
    );
  } else if (ipBlockInfo) {
    let simpleRateLimitWindowData = ipBlockInfo.simpleRateLimitWindowData;
    const i = simpleRateLimitWindowData?.findIndex(
      (info) => info.routeName === params.routeName
    );
    if (typeof i !== "undefined" && i !== -1 && simpleRateLimitWindowData![i]) {
      const isInTimeWindow =
        Date.now() -
          new Date(simpleRateLimitWindowData![i].timestamp).getTime() <
        simpleRateLimitWindowData![i].windowDuration;

      simpleRateLimitWindowData![i] = {
        ...simpleRateLimitWindowData![i],
        reqs: simpleRateLimitWindowData![i].reqs + 1,
      } as SimpleRateLimitWindowData;

      if (
        simpleRateLimitWindowData![i].reqs >=
        simpleRateLimitWindowData![i].maxReqs
      ) {
        if (isInTimeWindow) {
          await updateIPBlockInfo({ simpleRateLimitWindowData }, ipBlockInfo);
          return true;
        }
      }
      if (!isInTimeWindow) {
        simpleRateLimitWindowData = [
          ...simpleRateLimitWindowData!.filter(
            (data) => data.routeName !== params.routeName
          ),
          {
            routeName: params.routeName,
            timestamp: new Date().toISOString(),
            windowDuration: Number(params.windowMs),
            maxReqs: Number(params.maxReqs),
            reqs: 1,
          },
        ];
      }
    } else {
      simpleRateLimitWindowData?.push({
        routeName: params.routeName,
        timestamp: new Date().toISOString(),
        windowDuration: Number(params.windowMs),
        maxReqs: Number(params.maxReqs),
        reqs: 1,
      });
    }
    await updateIPBlockInfo({ simpleRateLimitWindowData }, ipBlockInfo);
  }
  return false;
};
