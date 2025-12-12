// types.ts

export type NotificationType = "GROUP_INVITE" | "FRIEND_REQUEST" | "NEW_POST";
export type ActionType = "ACCEPT" | "REJECT" | "VIEW";

export interface NotificationActor {
  name: string;
  avatar: string;
  address: string;
}

export interface NotificationContent {
  text: string;
  highlight?: string; // Phần chữ in đậm (ví dụ tên nhóm)
}

export interface NotificationPayload {
  actionId: string;   // ID dùng để gọi hàm trên smart contract (ví dụ: inviteId)
  resourceId?: string; // ID của đối tượng liên quan (ví dụ: groupId)
  [key: string]: any; // Cho phép mở rộng thêm dữ liệu khác
}

export interface Notification {
  id: string; // Unique ID cho React key
  type: NotificationType;
  createdAt: number;
  isUnread: boolean;
  actor: NotificationActor;
  content: NotificationContent;
  payload: NotificationPayload;
}