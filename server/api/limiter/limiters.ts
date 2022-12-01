import { Request as Req, Response as Res, NextFunction } from "express";

/**
 * My rate limiters
 *
 * simpleRateLimit   <- For really simple rate limiting, block an IP on
 *                      a specific route for a certain amount of time
 *                      if they make too many requests in a given time
 *                      window.
 *
 * bruteRateLimit    <- For protecting logins. You must call bruteFail
 *                      for every failed attempt, and call bruteSuccess
 *                      when there is a success. The block duration
 *                      increases exponentially. The number of fails
 *                      required can also be configured. Default
 *                      behaviour: 2hrs, 4hrs, 8hrs, 16 hrs, et cet.
 *                      The user gets 3 attempts. Needs testing.
 */

import {
  findIPBlockInfo,
  addSimpleRateLimiterBlock,
  IPBlockInfo,
  SimpleRateLimitWindowData,
  addIPBlockInfo,
  updateIPBlockInfo,
  prepBruteRateLimit,
  BruteRateLimitData,
} from "./limiterStore";

import getReqIp from "../../utils/getReqIp";
import convertMsToHM from "../../utils/convertMsToReadableTime";

const checkBlockedBySimpleBlock = async ({
  info,
  routeName = "",
}: {
  info: IPBlockInfo;
  routeName: "" | string;
}) => {
  let isBlocked = false;
  let i = 0;
  /* iterate through all the stored block information to check for active blocks
  matching the routeName */
  if (info.simpleRateLimitBlocks)
    while (isBlocked === false && i <= info.simpleRateLimitBlocks!.length - 1) {
      if (
        routeName === "" ||
        info.simpleRateLimitBlocks![i].routeName === routeName
      ) {
        const blockedAt = new Date(info.simpleRateLimitBlocks![i].blockedAt);
        const blockEnd =
          blockedAt.getTime() + info.simpleRateLimitBlocks![i].blockDuration;
        if (Date.now() < blockEnd) isBlocked = true;
      }
      i++;
    }
  return isBlocked;
};

const checkBlockedByBruteBlock = async ({
  info,
  routeName = "",
}: {
  info: IPBlockInfo;
  routeName: "" | string;
}) => {
  let isBlocked = false;
  let i = 0;
  /* iterate through all the stored block information to check for active blocks
  matching the routeName */
  if (info.bruteRateLimitData) {
    console.log(info.bruteRateLimitData!.length)
    while (isBlocked === false && i <= info.bruteRateLimitData!.length - 1) {
      console.log("check");
      const {
        routeName: checkRouteName,
        blockDuration,
        failsRequired,
        attempts,
        lastAttempt,
      } = info.bruteRateLimitData[i];
      console.log(checkRouteName);
      if (checkRouteName === routeName) {
        const modulo = attempts % failsRequired;
        if (modulo === 0) {
          const multiplier = attempts / failsRequired;
          const duration = blockDuration * Math.max(1, multiplier);
          const blockEnd = new Date(lastAttempt).getTime() + duration;
          if (Date.now() < blockEnd) {
            isBlocked = true;
          }
        }
      }
      i++;
    }
  }
  return isBlocked;
};

export type SimpleRateLimitParams = {
  maxReqs?: number;
  windowMs?: number;
  msg: string;
  routeName: string;
  blockDuration: number;
};

export type BruteRateLimitParams = {
  msg?: string;
  routeName: string;
  blockDuration: number;
  failsRequired: number;
};

const simpleRateLimitResponse = (
  res: Res,
  msg: string,
  blockDuration: number
) => {
  const outMsg = msg.replace("BLOCKDURATION", convertMsToHM(blockDuration));
  return res.status(429).json({ msg: outMsg }).end();
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
    msg: "Too many requests. You are blocked from performing this action for BLOCKDURATION.",
    routeName: "",
    blockDuration: 5000,
  }
) => {
  return async (req: Req, res: Res, next: NextFunction) => {
    const ip = getReqIp(req);
    const ipBlockInfo = await findIPBlockInfo(ip);
    if (ipBlockInfo) {
      const blocked = await checkBlockedBySimpleBlock({
        info: ipBlockInfo,
        routeName: params.routeName,
      });
      if (blocked)
        return simpleRateLimitResponse(res, params.msg, params.blockDuration);
    }
    if (await simpleRateLimitTrigger(ip, params)) {
      await addSimpleRateLimiterBlock(ip, {
        routeName: params.routeName,
        blockedAt: new Date().toISOString(),
        blockDuration: params.blockDuration,
      });
      return simpleRateLimitResponse(res, params.msg, params.blockDuration);
    }
    next();
  };
};

export const bruteFail = async (ip: string, routeName: string) => {
  const found = await findIPBlockInfo(ip);
  if (found) {
    const i = found.bruteRateLimitData
      ? found.bruteRateLimitData?.findIndex(
          (data) => data.routeName === routeName
        )
      : -1;
    let bruteRateLimitData: BruteRateLimitData[] =
      found.bruteRateLimitData || [];
    bruteRateLimitData[i] = {
      ...bruteRateLimitData[i],
      attempts: bruteRateLimitData[i].attempts + 1,
      lastAttempt: new Date().toISOString(),
    };
    await updateIPBlockInfo(
      {
        bruteRateLimitData,
      },
      found
    );
  } else {
    throw new Error("Could not find ip block info");
  }
};
export const bruteSuccess = async (ip: string, routeName: string) => {
  const found = await findIPBlockInfo(ip);
  if (found) {
    let bruteRateLimitData: BruteRateLimitData[] =
      found.bruteRateLimitData || [];
    await updateIPBlockInfo(
      {
        bruteRateLimitData: bruteRateLimitData.filter(
          (data) => data.routeName !== routeName
        ),
      },
      found
    );
  } else {
    throw new Error("Could not find ip block info");
  }
};

/**
 * bruteRateLimit must be using bruteFail() and bruteSuccess()
 * for it to function. Call bruteFail when there is a failure
 * case, and bruteSuccess when there is a success case.
 */
export const bruteRateLimit = (
  params: BruteRateLimitParams = {
    msg: "Too many requests",
    routeName: "",
    blockDuration: 1200000, //2hrs
    failsRequired: 3,
  }
) => {
  return async (req: Req, res: Res, next: NextFunction) => {
    const ip = getReqIp(req);
    const ipBlockInfo = await findIPBlockInfo(ip);
    if (ipBlockInfo) {
      console.log("found");
      const blocked = await checkBlockedByBruteBlock({
        info: ipBlockInfo,
        routeName: params.routeName,
      });
      if (blocked) return res.status(429).json({ msg: params.msg }).end();
    } else {
      console.log("not found");
    }
    await prepBruteRateLimit(params, ip);
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
