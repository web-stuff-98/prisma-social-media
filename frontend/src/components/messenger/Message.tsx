import { RiDeleteBin4Fill, RiEditBoxFill } from "react-icons/ri";
import ReactPlayer from "react-player";
import User from "../User";

/**
 * attachmentData = {
 *      type: "Video" || "Image" || "File"
 *      url: the url for the attachment
 * }
 */

export interface IAttachmentData {
  url: string;
  type: "Video" | "Image" | "File";
}

export default function Message({
  otherUser = false,
  attachmentData = null,
}: {
  otherUser?: boolean;
  attachmentData?: IAttachmentData | null;
}) {
  return (
    <div
      className={`p-0.5 mb-2 flex ${
        otherUser ? "flex-row-reverse text-right" : ""
      } items-start`}
    >
      {/* username, pfp & date */}
      <div className="p-0.5">
        <User
          reverse={otherUser}
          date={new Date()}
          user={{ id: "123", name: "Username" }}
        />
      </div>
      {/* message content & attachment */}
      <div className="gap-1 flex flex-col my-auto px-1">
        {attachmentData && attachmentData.type === "Video" && (
          <div className={`overflow-hidden rounded`}>
            <ReactPlayer width={"100%"} height={100} url={attachmentData.url} />
          </div>
        )}
        <p className={`leading-3 text-xs my-auto h-full`}>
          Message placeholder content here lorem ipsum dolor sit amet
          consectetur adicipising elit
        </p>
        {attachmentData && attachmentData.type === "Image" && (
          <div
            style={{
              backgroundImage: `url(${attachmentData.url})`,
              backgroundPosition: otherUser ? "right" : "left",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
            className={`w-full h-20 ${otherUser ? "pr-2" : "pl-2"}`}
          />
        )}
      </div>
      {/* edit & delete icons */}
      {!otherUser && (
        <div className="flex flex-col items-center ml-1.5 justify-center gap-1 rounded p-0.5 border">
          <button className="px-0 bg-transparent" aria-label="Edit message">
            <RiEditBoxFill className="text-lg drop-shadow" />
          </button>
          <button className="px-0 bg-transparent" aria-label="Delete message">
            <RiDeleteBin4Fill className="text-lg text-rose-600 drop-shadow" />
          </button>
        </div>
      )}
    </div>
  );
}
