import {
  useContext,
  createContext,
  useState,
  ReactNode,
  CSSProperties,
} from "react";

import { BsFillChatRightFill } from "react-icons/bs";

import MessengerTopIcons from "../components/MessengerTopIcons";
import ConversationSection from "../components/messenger/conversation/ConversationSection";
import ConversationsSection from "../components/messenger/conversations/ConversationsSection";

export const MessengerProvider = ({ children }: { children: ReactNode }) => {
  const [messengerOpen, setMessengerOpen] = useState(false);

  const openMessenger = () => {
    setMessengerSection("Conversations");
    setMessengerOpen(true);
  };
  const closeMessenger = () => {
    setMessengerOpen(false);
    setMessengerSection("Conversations");
  };

  const openConversation = (uid: string) => {
    setConversationWith(uid);
    setMessengerOpen(true);
    setMessengerSection("Conversation");
  };


  const [messengerSection, setMessengerSection] = useState<
    "Conversation" | "Conversations"
  >("Conversation");

  const [conversationWith, setConversationWith] = useState("");

  return (
    <MessengerContext.Provider
      value={{
        messengerOpen,
        openMessenger,
        closeMessenger,
        openConversation,
      }}
    >
      <div
        style={{
          ...messengerModalStyle,
          ...(messengerOpen ? messengerOpenStyle : messengerClosedStyle),
        }}
        className={`mx-auto ${
          messengerOpen ? "bg-white border" : "bg-transparent"
        } rounded-sm p-3 drop-shadow`}
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
            {/* Conversation */}
            {messengerSection === "Conversation" && (
              <ConversationSection
                conversationWith={conversationWith}
                setMessengerSection={setMessengerSection}
              />
            )}
            {/* Conversations */}
            {messengerSection === "Conversations" && (
              <ConversationsSection setMessengerSection={setMessengerSection} />
            )}
          </>
        )}
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
}>({
  messengerOpen: false,
  openMessenger: () => {},
  closeMessenger: () => {},
  openConversation: () => {},
});
export const useMessenger = () => useContext(MessengerContext);

const messengerModalStyle: CSSProperties = {
  zIndex: "100",
  position: "absolute",
  bottom: "1.25rem",
  right: "1.25rem",
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
