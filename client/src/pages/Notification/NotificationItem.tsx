import React, { useState } from "react";
import { Users, LucideIcon, UserPlus, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Notification, NotificationType, ActionType } from "../../types/notification";

interface ActionButtonsProps {
  onAccept: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
  processing: boolean;
}

interface NotificationConfigItem {
  icon: LucideIcon;
  iconColor: string;
  ActionButtons?: React.FC<ActionButtonsProps>;
}

// Cấu hình giao diện cho từng loại thông báo
const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfigItem> = {
  GROUP_INVITE: {
    icon: Users,
    iconColor: "bg-blue-500",
    ActionButtons: ({ onAccept, onReject, processing }) => (
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          disabled={processing}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {processing ? "..." : "Tham gia"}
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          className="px-4 py-1.5 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition disabled:opacity-50"
        >
          Từ chối
        </button>
      </div>
    ),
  },
  FRIEND_REQUEST: {
    icon: UserPlus,
    iconColor: "bg-green-500",
    ActionButtons: ({ onAccept, onReject, processing }) => (
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          disabled={processing}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {processing ? "..." : "Đồng ý"}
        </button>
        <button
          onClick={onReject}
          disabled={processing}
          className="px-4 py-1.5 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition disabled:opacity-50"
        >
          Xóa
        </button>
      </div>
    ),
  },
  NEW_POST: {
    icon: FileText,
    iconColor: "bg-purple-500",
  }
};

interface NotificationItemProps {
  data: Notification;
  onAction: (type: NotificationType, action: ActionType, payload: any) => Promise<boolean>;
  onRead: (id: string) => void; // <-- Prop mới để gọi markAsRead
}

const NotificationItem: React.FC<NotificationItemProps> = ({ data, onAction, onRead }) => {
  const [processing, setProcessing] = useState(false);

  const config = NOTIFICATION_CONFIG[data.type];
  if (!config) return null;

  const Icon = config.icon;
  const ActionButtons = config.ActionButtons;

  const executeAction = async (actionType: ActionType, e: React.MouseEvent) => {
    e.stopPropagation(); // Quan trọng: Ngăn không cho click nút lan ra click item
    if (processing) return;
    setProcessing(true);
    await onAction(data.type, actionType, data.payload);
    setProcessing(false);
  };

  // Xử lý khi click vào item
  const handleItemClick = () => {
    if (data.isUnread) {
      onRead(data.id);
    }
  };

  return (
    <div 
      onClick={handleItemClick}
      className={`p-3 rounded-lg transition duration-150 flex items-start cursor-pointer 
        ${data.isUnread ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-gray-100"}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 mr-3">
        <img 
          src={data.actor.avatar} 
          alt="Avatar" 
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border border-gray-200 shadow-sm" 
        />
        <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-white ${config.iconColor} border-2 border-white`}>
          <Icon size={12} strokeWidth={3} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <p className="text-sm text-gray-900 leading-snug">
          <span className="font-bold hover:underline">{data.actor.name} </span>
          {data.content.text}{" "}
          {data.content.highlight && (
            <span className="font-bold text-gray-800">"{data.content.highlight}"</span>
          )}
        </p>
        
        <p className={`text-xs mt-1 ${data.isUnread ? "text-blue-600 font-bold" : "text-gray-500"}`}>
          {formatDistanceToNow(data.createdAt * 1000, { addSuffix: true, locale: vi })}
        </p>

        {/* Buttons */}
        {ActionButtons && (
          <ActionButtons 
            onAccept={(e) => executeAction("ACCEPT", e)}
            onReject={(e) => executeAction("REJECT", e)}
            processing={processing}
          />
        )}
      </div>

      {/* Unread Dot */}
      {data.isUnread && (
        <div className="ml-2 mt-2 h-3 w-3 bg-blue-600 rounded-full flex-shrink-0"></div>
      )}
    </div>
  );
};

export default NotificationItem;