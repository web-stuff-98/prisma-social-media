import {
  PrivateMessage,
  User,
  RoomMessage,
  Room,
} from "@prisma/client";

import type Peer from "simple-peer";
import { ParsedPost } from "./utils/parsePost";

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
  private_conversation_video_chat_user_joined: (
    signal: Peer.SignalData,
    callerSid: string,
  ) => void;
  private_conversation_video_chat_user_left: () => void;
  private_conversation_video_chat_sending_signal: (payload: {
    userToSignal: string;
    signal: Peer.SignalData;
  }) => void;
  private_conversation_video_chat_returning_signal: (payload: {
    signal: Peer.SignalData;
    callerSid: string;
  }) => void;
  private_conversation_video_chat_receiving_returned_signal: (
    signal: Peer.SignalData,
  ) => void;
  private_conversation_video_chat_user: (sid: string) => void;

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

  post_cover_image_progress: (progress: number, slug: string) => void;

  profile_update: (data: { bio?: string; backgroundBase64?: string }) => void;

  user_visible_update: (data: {
    id: string;
    name?: string;
    online?: boolean;
    pfp?: string;
  }) => void;
  user_visible_deleted: (slug: string) => void;
  post_visible_update: (data: Partial<ParsedPost>) => void;
  post_visible_like_update: (
    addLike: boolean,
    sid: string,
    postId: string
  ) => void;
  post_visible_share_update: (
    addShare: boolean,
    sid: string,
    postId: string
  ) => void;
  post_visible_comment_update: (addComment: boolean, slug: string) => void;
  post_visible_deleted: (slug: string) => void;
}

export interface ClientToServerEvents {
  open_post: (slug: string) => void;
  leave_post: (slug: string) => void;

  user_visible: (uid: string) => void;
  user_not_visible: (uid: string) => void;
  open_profile: (uid: string) => void;
  close_profile: (uid: string) => void;
  post_card_visible: (slug: string) => void;
  post_card_not_visible: (slug: string) => void;

  room_video_chat_sending_signal: (payload: {
    userToSignal: string;
    callerSid: string;
    signal: Peer.SignalData;
  }) => void;
  room_video_chat_returning_signal: (payload: {
    signal: Peer.SignalData;
    callerSid: string;
  }) => void;

  private_conversation_video_chat_sending_signal: (payload: {
    userToSignal: string;
    signal: Peer.SignalData;
  }) => void;
  private_conversation_video_chat_returning_signal: (payload: {
    signal: Peer.SignalData;
    callerSid: string;
  }) => void;

  private_conversation_close: () => void;
  private_conversation_open: (conversationWith: string) => void;
  private_conversation_vid_chat_open: () => void;
  private_conversation_vid_chat_close: () => void;

  auth: () => void;
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
  conversationSubjectUid: string;
}
