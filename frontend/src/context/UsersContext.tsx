import {
  useState,
  useContext,
  createContext,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { IUser, useAuth } from "./AuthContext";
import { getUser } from "../services/users";
import { useSocket } from "./SocketContext";

type DisappearedUser = {
  uid: string;
  disappearedAt: Date;
};

export const UsersContext = createContext<{
  users: IUser[];
  cacheUserData: (uid: string, force?: boolean) => void;
  getUserData: (uid: string) => IUser | undefined;

  visibleUsers: string[];
  disappearedUsers: DisappearedUser[];

  userEnteredView: (uid: string) => void;
  userLeftView: (uid: string) => void;
}>({
  users: [],
  cacheUserData: () => {},
  getUserData: () => undefined,

  visibleUsers: [],
  disappearedUsers: [],

  userEnteredView: () => {},
  userLeftView: () => {},
});

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("user_visible_update", (data: Partial<IUser>) => {
      setUsers((p) => {
        let newUsers = p;
        const i = p.findIndex((u) => u.id === data.id);
        newUsers[i] = { ...newUsers[i], ...data };
        return [...newUsers];
      });
    });
    return () => {
      socket.off("user_visible_update");
    };
  }, [socket]);

  const cacheUserData = async (uid: string, force?: boolean) => {
    try {
      const found = users.find((u) => u.id === uid);
      if (found && !force) return;
      let u = await getUser(uid);
      if(user && uid === user?.id)
        u.online = true
      setUsers((p) => [...p, u]);
    } catch (e) {
      console.warn("Could not cache data for user : " + uid);
    }
  };
  const getUserData = useCallback(
    (uid: string) => users.find((u) => u.id === uid),
    [users]
  );

  const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
  const [disappearedUsers, setDisappearedUsers] = useState<DisappearedUser[]>(
    []
  );
  const userEnteredView = (uid: string) => {
    setVisibleUsers((p) => [...p, uid]);
    setDisappearedUsers((p) => [...p.filter((u) => u.uid !== uid)]);
    subscribeToUser(uid);
  };
  const userLeftView = (uid: string) => {
    const visibleCount =
      visibleUsers.filter((visibleUid) => visibleUid === uid).length - 1;
    if (visibleCount === 0) {
      setVisibleUsers((p) => [...p.filter((visibleUid) => visibleUid !== uid)]);
      setDisappearedUsers((p) => [
        ...p.filter((p) => p.uid !== uid),
        {
          uid,
          disappearedAt: new Date(),
        },
      ]);
    } else {
      setVisibleUsers((p) => {
        //instead of removing all matching UIDs, remove only one, because we need to retain the duplicates
        let newVisibleUsers = p;
        newVisibleUsers.splice(
          p.findIndex((vuid) => vuid === uid),
          1
        );
        return [...newVisibleUsers];
      });
    }
  };
  useEffect(() => {
    const i = setInterval(() => {
      const usersDisappeared30SecondsAgo = disappearedUsers
        .filter(
          (du) => new Date().getTime() - du.disappearedAt.getTime() > 30000
        )
        .map((du) => du.uid);
      setUsers((p) => [
        ...p.filter((u) => !usersDisappeared30SecondsAgo.includes(u.id)),
      ]);
      setDisappearedUsers((p) => [
        ...p.filter((u) => !usersDisappeared30SecondsAgo.includes(u.uid)),
      ]);
      usersDisappeared30SecondsAgo.forEach((uid) => unsubscribeFromUser(uid));
    }, 5000);
    return () => {
      clearInterval(i);
    };
  }, [disappearedUsers]);

  const subscribeToUser = useCallback(
    (uid: string) => {
      if (!socket) throw new Error("no socket");
      socket?.emit("user_visible", uid);
    },
    [socket]
  );
  const unsubscribeFromUser = useCallback(
    (uid: string) => {
      if (!socket) throw new Error("no socket");
      socket?.emit("user_not_visible", uid);
    },
    [socket]
  );

  return (
    <UsersContext.Provider
      value={{
        users,
        cacheUserData,
        getUserData,
        userEnteredView,
        userLeftView,
        visibleUsers,
        disappearedUsers,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

const useUsers = () => useContext(UsersContext);

export default useUsers;
