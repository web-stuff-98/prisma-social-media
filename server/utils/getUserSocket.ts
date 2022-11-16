import { io } from "..";

export default async (uid: string) => {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.user.id === uid) return socket;
  }
  throw new Error(`Could not find socket for UID ${uid} - they are probably not logged in`);
};
