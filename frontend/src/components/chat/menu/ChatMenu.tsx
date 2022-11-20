import {
  ChatSection,
  useChat,
} from "../../../context/ChatContext";

export default function Menu() {
  const { setChatSection } = useChat();

  const Button = ({
    name,
    section,
  }: {
    name: string;
    section: ChatSection;
  }) => {
    return (
      <button aria-label={name} onClick={() => setChatSection(section)}>
        {name}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2">
      <Button name="Join & create rooms" section="Chatrooms" />
      <Button name="Your conversations" section="Conversations" />
      <Button name="Your rooms" section="UsersChatrooms" />
      <Button name="Search users" section="SearchUsers" />
    </div>
  );
}
