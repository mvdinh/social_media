import { useState, useEffect, useCallback } from "react";
import { Notification, NotificationType, ActionType, NotificationPayload } from "../types/notification";
import { useAuth } from "../context/AuthContext";
import { convertProxyToArray } from "../utils/proxyUtils";

// Helper rút gọn ví
const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// Helper chuẩn hóa dữ liệu Group
const normalizeGroupInvites = (raw: any[]): any[] => {
  const arr = convertProxyToArray(raw);
  return arr
    .map((item: any) => {
      if (!item) return null;
      return {
        id: item.id ?? item[0],
        groupId: item.groupId ?? item[1],
        inviter: item.inviter ?? item[2],
        invitee: item.invitee ?? item[3],
        status: item.status ?? item[4],
        createdAt: item.createdAt ?? item[5],
      };
    })
    .filter(Boolean);
};

// Helper chuẩn hóa dữ liệu Friend
const normalizeFriendRequests = (raw: any[]): string[] => {
  return convertProxyToArray<string>(raw).filter((addr) => addr !== "0x0000000000000000000000000000000000000000");
};

export const useNotifications = () => {
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];
  const relationshipContract = contracts?.["relationship"];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- HELPER: Lấy danh sách ID đã đọc từ LocalStorage ---
  const getReadIds = useCallback((): Set<string> => {
    if (!address) return new Set();
    const storageKey = `read_notifications_${address}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  }, [address]);

  // ==============================
  // 1. FETCH NOTIFICATIONS
  // ==============================
  const fetchNotifications = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const loadedNotifications: Notification[] = [];
    const readIds = getReadIds(); // Lấy list đã đọc

    try {
      // ------------------------------------------------
      // A. FETCH GROUP INVITES
      // ------------------------------------------------
      if (groupContract) {
        try {
          const rawGroups = await groupContract.getMyPendingInvites();
          const groupInvites = normalizeGroupInvites(rawGroups);

          const formattedGroups = await Promise.all(
            groupInvites.map(async (inv) => {
              try {
                const groupInfo = await groupContract.getGroup(inv.groupId);
                const groupName = groupInfo?.name || `Group #${inv.groupId}`;
                const notifId = `group_inv_${inv.id}`;

                return {
                  id: notifId,
                  type: "GROUP_INVITE" as NotificationType,
                  createdAt: Number(inv.createdAt),
                  isUnread: !readIds.has(notifId), // Check trạng thái đọc
                  actor: {
                    name: shortenAddress(inv.inviter),
                    address: inv.inviter,
                    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${inv.inviter}`,
                  },
                  content: {
                    text: "đã mời bạn tham gia nhóm",
                    highlight: groupName,
                  },
                  payload: {
                    actionId: inv.id,
                    resourceId: inv.groupId,
                  },
                };
              } catch (e) {
                return null;
              }
            })
          );
          loadedNotifications.push(...(formattedGroups.filter(Boolean) as Notification[]));
        } catch (err) {
          console.error("Error fetching group invites:", err);
        }
      }

      // ------------------------------------------------
      // B. FETCH FRIEND REQUESTS
      // ------------------------------------------------
      if (relationshipContract) {
        try {
          const rawFriends = await relationshipContract.getPendingRequests(address);
          const friendRequests = normalizeFriendRequests(rawFriends);

          const formattedFriends: Notification[] = friendRequests.map((senderAddr) => {
            const notifId = `friend_req_${senderAddr}`;
            // Fake timestamp vì contract relationship không trả về time
            const fakeTimestamp = Date.now() / 1000; 

            return {
              id: notifId,
              type: "FRIEND_REQUEST" as NotificationType,
              createdAt: Number(fakeTimestamp), 
              isUnread: !readIds.has(notifId), // Check trạng thái đọc
              actor: {
                name: shortenAddress(senderAddr),
                address: senderAddr,
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${senderAddr}`,
              },
              content: {
                text: "đã gửi lời mời kết bạn",
                highlight: "",
              },
              payload: {
                actionId: senderAddr,
                resourceId: "", 
              },
            };
          });
          loadedNotifications.push(...formattedFriends);
        } catch (err) {
          console.error("Error fetching friend requests:", err);
        }
      }

      // Sắp xếp và Set State
      loadedNotifications.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(loadedNotifications);

    } catch (err) {
      console.error("General fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [groupContract, relationshipContract, address, getReadIds]);

  // ==============================
  // 2. HANDLE ACTION (Accept/Reject)
  // ==============================
  const handleAction = async (
    type: NotificationType,
    action: ActionType,
    payload: NotificationPayload
  ): Promise<boolean> => {
    try {
      let tx;

      if (type === "GROUP_INVITE" && groupContract) {
        if (action === "ACCEPT") tx = await groupContract.acceptInvite(payload.actionId);
        if (action === "REJECT") tx = await groupContract.rejectInvite(payload.actionId);
      }

      if (type === "FRIEND_REQUEST" && relationshipContract) {
        const senderAddress = payload.actionId; 
        if (action === "ACCEPT") tx = await relationshipContract.acceptFriendRequest(senderAddress);
        if (action === "REJECT") tx = await relationshipContract.rejectFriendRequest(senderAddress);
      }

      if (!tx) return false;

      await tx.wait();
      await fetchNotifications();
      return true;
    } catch (err) {
      console.error("Action error:", err);
      return false;
    }
  };

  // ==============================
  // 3. MARK AS READ (Logic Mới)
  // ==============================
  const markAsRead = (id: string) => {
    if (!address) return;

    // 1. Cập nhật UI ngay lập tức
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );

    // 2. Lưu vào LocalStorage
    const readIds = getReadIds();
    readIds.add(id);
    localStorage.setItem(`read_notifications_${address}`, JSON.stringify(Array.from(readIds)));
  };

  const markAllAsRead = () => {
    if (!address) return;
    const allIds = notifications.map(n => n.id);
    const readIds = getReadIds();
    allIds.forEach(id => readIds.add(id));
    
    localStorage.setItem(`read_notifications_${address}`, JSON.stringify(Array.from(readIds)));
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  // Auto load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { 
    notifications, 
    loading, 
    refetch: fetchNotifications, 
    handleAction, 
    markAsRead, 
    markAllAsRead 
  };
};