import { PrivateMessage, RoomMessage } from "@prisma/client";

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
  
  private_message: (id: string, data: PrivateMessage) => void;
  private_message_attachment_progress: (progress: number, id: string) => void;
  private_message_attachment_failed: (id: string) => void;
  private_message_attachment_complete: (
    id: string,
    type: string,
    key: string
  ) => void;
  private_message_error: (error: string) => void;
  private_message_update: (id: string, data: Partial<PrivateMessage>) => void;
  private_message_delete: (id: string) => void;
  private_message_request_attachment_upload: (id: string) => void;
  private_conversation_deleted: (conversationWith: string) => void;

  room_message: (
    id: string,
    data: RoomMessage,
  ) => void;
  room_message_request_attachment_upload: (id: string) => void;
  room_message_error: (error: string) => void;
  room_message_update: (id: string, data: Partial<RoomMessage>) => void;
  room_message_delete: (id: string) => void;
  room_message_attachment_failed: (id: string) => void;
  room_message_attachment_complete: (
    id: string,
    type: string,
    key: string
  ) => void;
  room_message_attachment_progress: (progress: number, id: string) => void;

  room_created: (id: string, name: string, authorId: string) => void;
  room_deleted: (id: string) => void;
  room_updated: (id: string, name: string) => void;

  room_user_joined: (uid:string) => void;
  room_user_left: (uid:string) => void;
  room_user_banned: (uid:string) => void;
  room_user_kicked: (uid:string) => void;

  user_subscription_update: (data: {
    id: string;
    name?: string;
    online?: boolean;
  }) => void;
}

export interface ClientToServerEvents {
  open_post: (slug: string) => void;
  leave_post: (slug: string) => void;

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
    room?: string;
  };
}
