import { IComment } from "../../context/PostContext";
import { Comment } from "./Comment";

export function CommentList({ comments }: { comments: IComment[] }) {
  return comments.map((comment) => (
    <div key={comment.id} className="w-full h-full">
      <Comment {...comment} />
    </div>
  ));
}
