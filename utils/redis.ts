import Redis from "ioredis";
const redisClient = new Redis(process.env.REDISCLOUD_URL as string)
export default redisClient

