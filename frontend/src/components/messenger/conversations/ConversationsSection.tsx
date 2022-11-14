import { IconBtn } from "../../IconBtn";
import User from "../../User";

import { useState, useEffect } from "react";

import { RiDeleteBin4Fill, RiMessage2Fill } from "react-icons/ri";
import { getConversations } from "../../../services/messenger";
import { IUser } from "../../../context/AuthContext";
import { useMessenger } from "../../../context/MessengerContext";
import useUsers from "../../../context/UsersContext";

export default function ConversationsSection({
  setMessengerSection,
}: {
  setMessengerSection: Function;
}) {
  const { openConversation } = useMessenger();
  const { getUserData } = useUsers();

  const [users, setUsers] = useState<IUser[]>([]);

  const [resMsg, setResMsg] = useState({ msg: "", err: false, pen: false });

  useEffect(() => {
    setResMsg({ msg: "", err: false, pen: true });
    getConversations()
      .then((users) => {
        setUsers(users);
        setResMsg({ msg: "", err: false, pen: false });
      })
      .catch((e) => {
        setResMsg({ msg: `${e}`, err: true, pen: false });
      });
  }, []);

  return (
    <div className="flex flex-col overflow-y-auto max-h-full w-full">
      {users.map((user) => (
        <div
          key={user.id}
          className="p-2 w-full flex justify-between items-center"
        >
          <User
            uid={user.id}
            overridePfpOnClick={() => {
              openConversation(user.id);
            }}
            user={getUserData(user.id)}
          />
          <div className="flex flex-col gap-2 cursor-pointer">
            <IconBtn
              aria-label="Delete conversation with user"
              color="text-rose-600"
              Icon={RiDeleteBin4Fill}
            />
            <IconBtn
              onClick={() => openConversation(user.id)}
              aria-label="Conversation with user"
              Icon={RiMessage2Fill}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
