import { useState } from "react";
import { Campaign } from "./DonatePage";
import { DonateDialog } from "./DonateDialog";
import { DonorsListDialog } from "./DonorsListDialog";
import { Heart, Target, TrendingUp, Users, Archive } from "lucide-react";
import { useAuth1 } from "../../context/Context";

interface DonateCardProps {
  campaign: Campaign;
  onDonate: (campaignId: string, donorName: string, amount: number) => void;
  onArchive: (campaignId: string) => void;
}

export function DonateCard({ campaign, onDonate, onArchive }: DonateCardProps) {
  const { user } = useAuth1();
  const address = user?.address;
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false);
  const [isDonorsListOpen, setIsDonorsListOpen] = useState(false);

  const progressPercentage = Math.min(
    (campaign.currentAmount / campaign.goalAmount) * 100,
    100
  );

  const isCompleted = progressPercentage >= 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleDonateSubmit = (amount: number) => {
    // ✅ Không cần donorName, truyền address làm placeholder
    onDonate(campaign.id, address || "", amount);
    setIsDonateDialogOpen(false);
  };

  const handleArchive = () => {
    if (confirm(`Bạn có chắc chắn muốn lưu trữ chiến dịch "${campaign.title}"?`)) {
      onArchive(campaign.id);
    }
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 pb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                {campaign.createdByMe && (
                  <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                    Của tôi
                  </span>
                )}
              </div>
              <p className="text-blue-50 text-sm">
                {campaign.description}
              </p>
            </div>
            <Heart className="h-6 w-6 text-white opacity-80 flex-shrink-0 ml-4" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isCompleted 
                    ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">{progressPercentage.toFixed(1)}% hoàn thành</span>
              <span className={isCompleted ? "text-green-600 font-semibold" : "text-gray-600"}>
                {isCompleted ? "✓ Đạt mục tiêu!" : ""}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start space-x-3 bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Đã quyên góp</p>
                <p className="text-base font-semibold text-green-600 truncate">{formatCurrency(campaign.currentAmount)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Mục tiêu</p>
                <p className="text-base font-semibold text-blue-600 truncate">{formatCurrency(campaign.goalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Donors count - only show if createdByMe */}
          {campaign.createdByMe && campaign.donations.length > 0 && (
            <button
              onClick={() => setIsDonorsListOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-purple-900">Người đã quyên góp</p>
                  <p className="text-xs text-purple-600">{campaign.donations.length} người</p>
                </div>
              </div>
              <span className="text-purple-600 text-sm font-medium">Xem chi tiết →</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => setIsDonateDialogOpen(true)}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Heart className="mr-2 h-4 w-4" />
            Quyên Góp Ngay
          </button>

          {/* Archive button - only show if createdByMe */}
          {campaign.createdByMe && (
            <button
              onClick={handleArchive}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <Archive className="mr-2 h-4 w-4" />
              Lưu Trữ Chiến Dịch
            </button>
          )}
        </div>
      </div>

      {isDonateDialogOpen && address && (
        <DonateDialog
          campaignTitle={campaign.title}
          userAddress={address}
          onClose={() => setIsDonateDialogOpen(false)}
          onDonate={handleDonateSubmit}
        />
      )}

      {isDonorsListOpen && campaign.createdByMe && (
        <DonorsListDialog
          campaign={campaign}
          onClose={() => setIsDonorsListOpen(false)}
        />
      )}
    </>
  );
}