export interface ServerToClientEvents {
  comment_added: (
    message: string,
    commentId: string,
    parentId: string | undefined,
    uid: string,
    name: string
  ) => void;
  comment_updated: (message: string, commentId: string, uid: string) => void;
  comment_deleted: (commentId: string, uid: string) => void;
  comment_liked: (addLike: boolean, uid: string) => void;
  private_message_attachment_progress: (
    progress: number,
    msgId: string
  ) => void;
  private_message_attachment_failed: (messageId: string) => void;
  private_message_attachment_complete: (
    messageId: string,
    type: string
  ) => void;
  private_message_error: (error:string) => void;
}

export interface ClientToServerEvents {
  open_post: (slug: string) => void;
  leave_post: (slug: string) => void;

  private_message: (message: string, recipientId: string, hasAttachment:boolean) => void;
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
