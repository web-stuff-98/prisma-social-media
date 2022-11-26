import {
  useState,
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";

import io, { Socket } from "socket.io-client";

import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../server/socket-interfaces";

const SocketContext = createContext<{
  socket?: Socket<ServerToClientEvents, ClientToServerEvents>;
  authSocket: () => void;
}>({
  socket: undefined,
  authSocket: () => {},
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<
    Socket<ServerToClientEvents, ClientToServerEvents> | undefined
  >();

  const connectSocket = () => {
    const socket = io("http://localhost:3001", {
      withCredentials: true,
    }).connect();
    setSocket(socket);
  };

  const authSocket = () => {
    socket?.emit("auth");
  };

  useEffect(() => {
    connectSocket();
    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, authSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
