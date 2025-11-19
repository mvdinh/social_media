import { useState, useEffect } from "react";
import { Campaign } from "./DonatePage";
import { Plus, Target, X } from "lucide-react";

interface CreateCampaignDialogProps {
  onClose: () => void;
  onCreateCampaign: (
    campaign: Omit<
      Campaign,
      "id" | "currentAmount" | "createdByMe" | "donations"
    >,
  ) => void;
}

export function CreateCampaignDialog({
  onClose,
  onCreateCampaign,
}: CreateCampaignDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () =>
      window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      title &&
      description &&
      goalAmount &&
      parseFloat(goalAmount) > 0
    ) {
      onCreateCampaign({
        title,
        description,
        goalAmount: parseFloat(goalAmount),
      });
    }
  };

  const isValid =
    title.trim() &&
    description.trim() &&
    goalAmount &&
    parseFloat(goalAmount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-gray-900">
                Tạo Chiến Dịch Mới
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Tạo chiến dịch quyên góp mới để kêu gọi sự hỗ trợ
              từ cộng đồng.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm text-gray-700"
            >
              Tên chiến dịch{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="VD: Giúp đỡ trẻ em vùng cao"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm text-gray-700"
            >
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              placeholder="Mô tả chi tiết về mục đích và kế hoạch sử dụng số tiền quyên góp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Goal Amount */}
          <div className="space-y-2">
            <label
              htmlFor="goal-amount"
              className="block text-sm text-gray-700"
            >
              Mục tiêu quyên góp (USD){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="goal-amount"
                type="number"
                placeholder="VD: 50000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                step="1"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Nhập số tiền bạn muốn kêu gọi quyên góp
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white transition-all duration-200 ${
                isValid
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo Chiến Dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}