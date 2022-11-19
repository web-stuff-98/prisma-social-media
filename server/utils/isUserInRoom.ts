import { io } from "..";

export default async (uid: string, roomId: string) => {
  const sockets = await io.fetchSockets();
  const socket = sockets.find((s) => s.data.user.id === uid);
  return socket ? io.sockets.adapter.socketRooms(socket.id)?.has(`room=${roomId}`) : false;
};
