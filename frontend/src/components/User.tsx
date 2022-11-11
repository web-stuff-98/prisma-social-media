import { IconBtn } from "./comments/IconBtn";
import { RiEditBoxFill, RiDeleteBin4Fill } from "react-icons/ri";
import { IUser } from "../context/AuthContext";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * date = Not required, renders a date under the username
 *
 * editDeleteIcons = if true, show edit/delete icons between pfp and text
 * you will need to assign the other variables for that too
 */

export default function User({
  date,
  user,
  by = undefined,
  editDeleteIcons = false,
  onEditClick,
  onDeleteClick,
  isEditing,
  isDeleting,
  reverse = false,
}: {
  date?: Date;
  user?: Partial<IUser>;
  by?: boolean;
  editDeleteIcons?: boolean;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  isEditing?: boolean;
  isDeleting?: boolean;
  reverse?: boolean;
}) {
  const getDateString = (date:Date) => dateFormatter.format(date);
  const renderDateTime = (dateString: string) => {
    return (
      <div
        className={`flex flex-col pb-1 text-xs leading-3 ${
          reverse ? "items-end" : "items-start"
        }`}
      >
        <span>{dateString.split(", ")[0]}</span>
        <span>{dateString.split(", ")[1]}</span>
      </div>
    );
  };

  return (
    <div
      className={`${reverse ? "text-right" : "text-left"} flex ${
        reverse ? "flex-row-reverse" : ""
      } items-center justify-center`}
    >
      <div className="w-10 h-10 bg-gray-500 rounded-full shadow-md" />
      {editDeleteIcons && (
        <div
          className={`h-full drop-shadow ${
            reverse ? "pl-0.5 pr-1" : "pl-1 pr-0.5"
          } flex flex-col gap-1`}
        >
          <IconBtn
            onClick={() => { if(
              onEditClick)onEditClick()
            
              console.log("click")
            }}
            isActive={isEditing}
            Icon={RiEditBoxFill}
            aria-label={isEditing ? "Cancel Edit" : "Edit"}
          />
          <IconBtn
            disabled={isDeleting}
            onClick={onDeleteClick}
            Icon={RiDeleteBin4Fill}
            aria-label="Delete"
            color="text-rose-600"
          />
        </div>
      )}
      <div className="leading-3 mt-0.5 px-1">
        <h1 className="font-bold text-sm pb-0.5 leading-3 whitespace-nowrap">
          {by && "By "}
          {user?.name}
        </h1>
        {date && renderDateTime(getDateString(date))}
      </div>
    </div>
  );
}
