import Redis from "ioredis";
const redisClient = process.env.REDISCLOUD_URL ? new Redis(process.env.REDISCLOUD_URL as string) : new Redis()
export default redisClient

