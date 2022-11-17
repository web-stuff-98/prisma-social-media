import { useContext, createContext, useState, useEffect } from "react";
import type { ReactNode, CSSProperties } from "react";

import { BsFillChatRightFill } from "react-icons/bs";

import MessengerTopIcons from "../components/MessengerTopIcons";
import ConversationSection from "../components/messenger/conversation/ConversationSection";
import ConversationsSection from "../components/messenger/conversations/ConversationsSection";
import ChatMenu from "../components/messenger/menu/ChatMenu";
import SearchUsers from "../components/messenger/searchUsers/SearchUsers";
import UsersChatrooms from "../components/messenger/usersChatrooms/UsersChatrooms";
import { getRooms } from "../services/chat";
import { useSocket } from "./SocketContext";
import useScrollbarSize from "react-scrollbar-size";

export type MessengerSection =
  | "Menu"
  | "SearchUsers"
  | "UsersChatrooms"
  | "Conversations"
  | "Conversation"
  | "Chatrooms"
  | "Chatroom";

export interface IRoom {
  id: string;
  name: string;
  authorId: string;
}

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { width: scrollBarWidth } = useScrollbarSize();

  const [messengerOpen, setMessengerOpen] = useState(false);
  const [messengerSection, setMessengerSection] =
    useState<MessengerSection>("Menu");
  const [conversationWith, setConversationWith] = useState("");
  const openMessenger = () => {
    setMessengerSection("Menu");
    setMessengerOpen(true);
  };
  const closeMessenger = () => {
    setMessengerOpen(false);
    setMessengerSection("Menu");
  };
  const openConversation = (uid: string) => {
    setConversationWith(uid);
    setMessengerOpen(true);
    setMessengerSection("Conversation");
  };

  const [rooms, setRooms] = useState<IRoom[]>();
  useEffect(() => {
    getRooms().then((rooms: IRoom[]) => setRooms(rooms));
    if (!socket) return;
  }, [socket]);

  const [streamWindowsOffset, setStreamWindowsOffset] = useState({
    left: "0",
    bottom: "0",
  });
  useEffect(() => {
    setStreamWindowsOffset(
      messengerSection === "Conversation"
        ? { left: "0", bottom: "2.25em" }
        : { left: "0", bottom: "0" }
    );
  }, [messengerSection]);

  return (
    <MessengerContext.Provider
      value={{
        messengerOpen,
        openMessenger,
        closeMessenger,
        openConversation,
        setMessengerSection,
        messengerSection,
        streamWindowsOffset,
      }}
    >
      <div
        style={{
          ...messengerModalStyle,
          ...(messengerOpen ? messengerOpenStyle : messengerClosedStyle),
          ...(messengerSection === "Menu"
            ? { width: "fit-content", height: "fit-content" }
            : {}),
          right: `calc(${scrollBarWidth}px + 0.125rem)`,
          bottom: `calc(${scrollBarWidth}px + 0.125rem)`,
        }}
        className={`mx-auto relative ${
          messengerOpen ? "bg-white border" : "bg-transparent"
        } rounded p-3 shadow-xl`}
      >
        {/* close messenger icon tray / open messenger icon */}
        {messengerOpen ? (
          <MessengerTopIcons />
        ) : (
          <button className="px-0 bg-transparent" aria-label="Open messenger">
            <BsFillChatRightFill
              onClick={() => openMessenger()}
              className="text-3xl cursor-pointer text-black drop-shadow"
            />
          </button>
        )}
        {messengerOpen && (
          <>
            {/* Menu */}
            {messengerSection === "Menu" && <ChatMenu />}
            {/* Search users */}
            {messengerSection === "SearchUsers" && <SearchUsers />}
            {/* Users chatrooms */}
            {messengerSection === "UsersChatrooms" && <UsersChatrooms />}
            {/* Conversation */}
            {messengerSection === "Conversation" && (
              <ConversationSection conversationWith={conversationWith} />
            )}
            {/* Conversations */}
            {messengerSection === "Conversations" && <ConversationsSection />}
          </>
        )}
        {/*<VideoChatWindow />*/}
      </div>
      {children}
    </MessengerContext.Provider>
  );
};

const MessengerContext = createContext<{
  messengerOpen: boolean;
  openMessenger: () => void;
  closeMessenger: () => void;
  openConversation: (uid: string) => void;
  setMessengerSection: (to: MessengerSection) => void;
  messengerSection: MessengerSection;
  streamWindowsOffset: { left: string; bottom: string };
}>({
  messengerOpen: false,
  openMessenger: () => {},
  closeMessenger: () => {},
  openConversation: () => {},
  setMessengerSection: () => {},
  messengerSection: "Menu",
  streamWindowsOffset: { left: "0", bottom: "0" },
});
export const useMessenger = () => useContext(MessengerContext);

const messengerModalStyle: CSSProperties = {
  zIndex: "99",
  position: "absolute",
  overflow: "hidden",
};

const messengerOpenStyle: CSSProperties = {
  width: "min(22.5pc, calc(100vw - 1rem))",
  height: "min(30pc, calc(100vh - 1rem))",
  padding: "0",
  paddingTop: "1.5rem",
};

const messengerClosedStyle: CSSProperties = {
  width: "fit-content",
  height: "fit-content",
  bottom: "0",
  right: "0",
};
