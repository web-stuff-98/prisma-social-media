import {
  MessengerSection,
  useMessenger,
} from "../../../context/MessengerContext";

export default function Menu() {
  const { setMessengerSection } = useMessenger();

  const Button = ({
    name,
    section,
  }: {
    name: string;
    section: MessengerSection;
  }) => {
    return (
      <button aria-label={name} onClick={() => setMessengerSection(section)}>
        {name}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2">
      <Button name="Find & create rooms" section="Chatrooms" />
      <Button name="Your conversations" section="Conversations" />
      <Button name="Your rooms" section="UsersChatrooms" />
      <Button name="Search users" section="SearchUsers" />
    </div>
  );
}
