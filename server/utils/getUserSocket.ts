import { io } from "..";

export default async (uid: string) => {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if (socket.data.user.id === uid) return socket;
  }
  return undefined
};
