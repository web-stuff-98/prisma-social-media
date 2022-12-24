import { io } from "..";

import has from "lodash/has";

export default async (uid: string) => {
  const sockets = await io.fetchSockets();
  for (const socket of sockets)
    if (has(socket.data.user, "id"))
      if (socket.data.user.id === uid) return socket;
  return undefined;
};
