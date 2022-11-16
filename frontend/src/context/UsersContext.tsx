import {
  useState,
  useContext,
  createContext,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { IUser } from "./AuthContext";
import { getUser } from "../services/users";
import { useSocket } from "./SocketContext";

/**
 * This is my fancy user data context store. It is supposed to improve scalability, but it also sets up
 * live updates for User data, so that you can see updates right away for any user on the screen.
 *
 * It works with the User component to automatically get data for User components when they come into view,
 * and remove the data for the user 30 seconds after it disappears from view. That way data for users can be
 * kept in one place and data for Users dont have to be repeatedly sent with every request.
 *
 * Also it works with socket.io and the server to get live updates for Users
 *
 * Use getUserData to retrieve data for the user, it uses useCallback which means that the component using the
 * data will be automatically rerendered if the user data changes.
 *
 * You should use cacheUserData to cache the user data beforehand or the client might see user data
 * loading for a bit and it could look slow.
 */

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

  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("user_subscription_update", (data: Partial<IUser>) => {
      setUsers((p) => {
        let newUsers = p;
        const i = p.findIndex((u) => u.id === data.id);
        newUsers[i] = { ...newUsers[i], ...data };
        return [...newUsers];
      });
    });
    return () => {
      socket.off("user_subscription_update");
    };
  }, [socket]);

  const cacheUserData = async (
    uid: string,
    force?: boolean
  ): Promise<undefined> => {
    try {
      const found = users.find((u) => u.id === uid);
      if (found && !force) return;
      const u = await getUser(uid);
      setUsers((p) => [...p, u]);
    } catch (e) {
      console.warn("Could not cache data for user : " + uid);
    }
    return undefined;
  };
  const getUserData = useCallback(
    (uid: string) => {
      try {
        const u = users.find((u) => u.id === uid);
        if (!u) throw new Error("Could not find user data for : " + uid);
        return u;
      } catch (e) {
        console.warn(`${e}`);
      }
    },
    [users]
  );

  const [visibleUsers, setVisibleUsers] = useState<string[]>([]);
  const [disappearedUsers, setDisappearedUsers] = useState<DisappearedUser[]>(
    []
  );
  const userEnteredView = (uid: string) => {
    setVisibleUsers((p) => [...p, uid]);
    setDisappearedUsers((p) => [...p.filter((u) => u.uid !== uid)]);
    subscribeToUser(uid)
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

  const subscribeToUser = (uid: string) => {
    if (!socket) throw new Error("no socket");
    socket?.emit("subscribe_to_user", uid);
  };
  const unsubscribeFromUser = (uid: string) =>
    socket?.emit("unsubscribe_to_user", uid);

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
