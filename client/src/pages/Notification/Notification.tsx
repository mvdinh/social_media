import React from "react";
import { MoreHorizontal, Loader2, CheckCheck } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { Notification, NotificationType, ActionType } from "../../types/notification";

interface Props {
  notifications: Notification[];
  loading: boolean;
  onAction: (type: NotificationType, action: ActionType, payload: any) => Promise<boolean>;
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationPanel: React.FC<Props> = ({ notifications, loading, onAction, onRead, onMarkAllRead }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden font-sans h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <div className="flex gap-1">
            <button 
                onClick={onMarkAllRead} 
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600" title="Đánh dấu tất cả là đã đọc"
            >
                <CheckCheck className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                <MoreHorizontal className="h-6 w-6" />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 px-4 py-3 bg-white">
        <button className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-bold text-sm transition">
          Tất cả
        </button>
        <button className="px-4 py-1.5 rounded-full text-gray-600 font-semibold text-sm hover:bg-gray-100 transition">
          Chưa đọc
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-200">
        <div className="px-2 py-2">
          <h3 className="text-base font-semibold text-gray-700 mb-2">Mới nhất</h3>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-500" />
              <p className="text-sm font-medium">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm flex flex-col items-center">
               <span className="text-4xl mb-2">🔕</span>
              Bạn không có thông báo nào.
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((item) => (
                <NotificationItem 
                  key={item.id} 
                  data={item} 
                  onAction={onAction} 
                  onRead={onRead} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;