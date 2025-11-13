import { useState } from "react";

interface AddFriendButton {
  friendName: string;
}

export function AddFriendButton({ onUnfriend }: AddFriendButton) {

  const handleConfirm = () => {
    onUnfriend();
  };

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
      >
        Kết bạn
      </button>

    </>
  );
}
