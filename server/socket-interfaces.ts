import { Post, PrivateMessage, User, RoomMessage, Room } from "@prisma/client";

import type Peer from "simple-peer";

interface RoomWithUsers extends Room {
  members?: Partial<User>[];
  banned?: Partial<User>[];
}

export interface ServerToClientEvents {
  comment_added: (
    message: string,
    commentId: string,
    parentId: string | undefined,
    uid: string,
    name: string,
    postSlug: string
  ) => void;
  comment_updated: (
    message: string,
    commentId: string,
    uid: string,
    postSlug: string
  ) => void;
  comment_deleted: (commentId: string, uid: string, postSlug: string) => void;
  comment_liked: (addLike: boolean, uid: string, postSlug: string) => void;

  private_message: (data: PrivateMessage) => void;
  private_message_attachment_progress: (progress: number, id: string) => void;
  private_message_attachment_failed: (id: string) => void;
  private_message_attachment_complete: (
    id: string,
    type: string,
    key: string
  ) => void;
  private_message_error: (error: string) => void;
  private_message_update: (data: Partial<PrivateMessage>) => void;
  private_message_delete: (id: string) => void;
  private_message_request_attachment_upload: (id: string) => void;
  private_conversation_deleted: (conversationWith: string) => void;

  room_message: (data: RoomMessage) => void;
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

  room_video_chat_user_joined: (
    signal: Peer.SignalData,
    callerSid: string,
    callerUid: string
  ) => void;
  room_video_chat_user_left: (uid: string) => void;
  room_video_chat_sending_signal: (payload: {
    userToSignal: string;
    callerSid: string;
    signal: Peer.SignalData;
  }) => void;
  room_video_chat_returning_signal: (payload: {
    signal: Peer.SignalData;
    callerSid: string;
  }) => void;
  room_video_chat_receiving_returned_signal: (
    signal: Peer.SignalData,
    sid: string
  ) => void;
  room_video_chat_all_users: (
    peers: {
      uid: string;
      sid: string;
    }[]
  ) => void;

  room_created: (data: RoomWithUsers) => void;
  room_deleted: (id: string) => void;
  room_updated: (data: Partial<RoomWithUsers>) => void;

  post_created: (data: Post) => void;
  post_deleted: (id: string) => void;
  post_updated: (data: Partial<Post>) => void;

  post_cover_image_progress: (progress: number, slug: string) => void;

  user_visible_update: (data: {
    id: string;
    name?: string;
    online?: boolean;
  }) => void;
  post_card_visible_update: (data: Partial<Post>) => void;
}

export interface ClientToServerEvents {
  auth: () => void;

  open_post_comments: (slug: string) => void;
  leave_post_comments: (slug: string) => void;

  user_visible: (uid: string) => void;
  user_not_visible: (uid: string) => void;
  post_card_visible: (id: string) => void;
  post_card_not_visible: (id: string) => void;

  room_video_chat_sending_signal: (payload: {
    userToSignal: string;
    callerSid: string;
    signal: Peer.SignalData;
  }) => void;
  room_video_chat_returning_signal: (payload: {
    signal: Peer.SignalData;
    callerSid: string;
  }) => void;
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
  vidChatOpen: boolean;
}
