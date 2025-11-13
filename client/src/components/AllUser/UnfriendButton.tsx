import { useState } from "react";

interface UnfriendButtonProps {
  friendName: string;
  onUnfriend: () => void;
}

export function UnfriendButton({ friendName, onUnfriend }: UnfriendButtonProps) {
  const [showPopup, setShowPopup] = useState(false);

  const handleConfirm = () => {
    onUnfriend();
    setShowPopup(false);
  };

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
      >
        Hủy kết bạn
      </button>

      {showPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[1px] bg-transparent"
        >
          <div className="bg-white/95 shadow-lg rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-200">
            <h3 className="mb-4 text-gray-900 text-center">
              Bạn có muốn hủy kết bạn với <strong>{friendName}</strong> không?
            </h3>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Xác nhận
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
