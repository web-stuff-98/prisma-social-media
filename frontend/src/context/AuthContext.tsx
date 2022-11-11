import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useModal } from "./ModalContext";
import { makeRequest } from "../services/makeRequest";

const AuthContext = createContext<{
  login: (username: string, password: string) => void;
  register: (username: string, password: string) => void;
  logout: () => void;
  user: IUser | undefined;
}>({
  login: () => {},
  logout: () => {},
  register: () => {},
  user: undefined,
});

export interface IUser {
  id: string;
  name: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { openModal } = useModal();

  const [user, setUser] = useState();

  const checkUser = async () => {
    try {
      const user = await makeRequest("/api/users/check", {
        method: "POST",
        withCredentials: true,
      });
      setUser(user);
    } catch (error) {
      console.warn(error);
    }
  };

  useEffect(() => {
    const checkUserInterval = setInterval(checkUser, 10000);
    checkUser();
    return () => clearInterval(checkUserInterval);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const user = await makeRequest("/api/users/login", {
        method: "POST",
        url: "/api/users/login",
        data: { username, password },
        withCredentials: true,
      });
      setUser(user);
    } catch (e) {
      openModal("Message", {
        err: true,
        msg: `${e}`,
        pen: false,
      });
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const user = await makeRequest("/api/users/register", {
        method: "POST",
        data: { username, password },
        withCredentials: true,
      });
      setUser(user);
    } catch (e) {
      openModal("Message", {
        err: true,
        msg: `${e}`,
        pen: false,
      });
    }
  };

  const logout = async () => {
    try {
      await makeRequest("/api/users/logout", {
        method: "POST",
      });
      setUser(undefined);
    } catch (e) {
      openModal("Message", {
        err: true,
        msg: `${e}`,
        pen: false,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ login, logout, register, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
