import { io } from "..";

export default async (uid: string) => {
  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    if(!socket.data.user.id) {
      console.warn("No uid for socket " + socket.id)
      return undefined
    }
    if (socket.data.user.id === uid) return socket;
  }
  return undefined
};
