export interface ServerToClientEvents {
  commentAdded: (
    message: string,
    commentId: string,
    parentId: string | undefined,
    uid: string,
    name: string
  ) => void;
  commentUpdated: (message: string, commentId: string, uid: string) => void;
  commentDeleted: (commentId: string, uid: string) => void;
  commentLiked: (addLike: boolean, uid: string) => void;
}

export interface ClientToServerEvents {
  openPost: (slug: string) => void;
  leavePost: (slug: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: {
    id: string;
    name: string;
  };
}
