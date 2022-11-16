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
  private_message: (
    id: string,
    message: string,
    senderId: string,
    hasAttachment: boolean,
    attachmentType?: string,
    attachmentError?: boolean,
    attachmentKey?: string,
    attachmentPending?: boolean
  ) => void;
  private_message_attachment_progress: (
    progress: number,
    msgId: string
  ) => void;
  private_message_attachment_failed: (messageId: string) => void;
  private_message_attachment_complete: (
    messageId: string,
    type: string,
    key: string
  ) => void;
  private_message_error: (error: string) => void;
  private_message_update: (id: string, message: string) => void;
  private_message_delete: (id: string) => void;
  private_message_request_attachment_upload: (id:string) => void;
  private_conversation_deleted: (conversationWith: string) => void;

  user_subscription_update: (data: {
    id: string;
    name?: string;
    online?: boolean;
  }) => void;
}

export interface ClientToServerEvents {
  open_post: (slug: string) => void;
  leave_post: (slug: string) => void;

  private_message: (
    message: string,
    recipientId: string,
    hasAttachment: boolean
  ) => void;
  private_message_error: (error: string) => void;
  private_message_update: (id: string, message: string) => void;
  private_message_delete: (id: string) => void;

  subscribe_to_user: (uid: string) => void;
  unsubscribe_to_user: (uid: string) => void;
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
