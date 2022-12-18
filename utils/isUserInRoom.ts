/**
 * Returns the socket so that you don't have to fetch all the sockets twice.
 * Returns false if the user isn't in the room
 */

import { io } from "..";

export default async (uid: string, roomId: string) => {
  const sockets = await io.fetchSockets();
  const socket = sockets.find((s) => s.data.user.id === uid);
  return socket
    ? io.sockets.adapter.socketRooms(socket.id)?.has(`room=${roomId}`)
      ? socket
      : false
    : false;
};
