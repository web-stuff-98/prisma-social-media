/*
 */

import { IPBlockInfo } from "./api/limiter/limiterStore";
declare global {
    var blockedIPsInfo: IPBlockInfo[] = [];
}
export { }