import { useState, useEffect } from "react";
import { Campaign } from "./DonatePage";
import { DonorsListDialog } from "./DonorsListDialog";
import { X, Archive, TrendingUp, Target, Users } from "lucide-react";

interface ArchivedCampaignsDialogProps {
  campaigns: Campaign[];
  onClose: () => void;
}

export function ArchivedCampaignsDialog({ campaigns, onClose }: ArchivedCampaignsDialogProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedCampaign) {
          setSelectedCampaign(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, selectedCampaign]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Dialog */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Archive className="h-5 w-5 text-gray-600" />
                <h2 className="text-gray-900">Chiến Dịch Đã Lưu Trữ</h2>
              </div>
              <p className="text-sm text-gray-600">
                Xem lại các chiến dịch bạn đã tạo và danh sách người quyên góp
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng chiến dịch</p>
              <p className="text-gray-900">{campaigns.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng đã quyên góp</p>
              <p className="text-green-600">
                {formatCurrency(campaigns.reduce((sum, c) => sum + c.currentAmount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng người ủng hộ</p>
              <p className="text-purple-600">
                {campaigns.reduce((sum, c) => sum + c.donations.length, 0)} người
              </p>
            </div>
          </div>

          {/* Content - Scrollable List */}
          <div className="flex-1 overflow-y-auto p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có chiến dịch nào được lưu trữ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const progressPercentage = Math.min(
                    (campaign.currentAmount / campaign.goalAmount) * 100,
                    100
                  );
                  const isCompleted = progressPercentage >= 100;

                  return (
                    <div
                      key={campaign.id}
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      {/* Campaign Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-gray-900">{campaign.title}</h3>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0 ml-2">
                              ✓ Hoàn thành
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted 
                                ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                                : "bg-gradient-to-r from-blue-500 to-purple-500"
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {progressPercentage.toFixed(1)}% hoàn thành
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="flex items-center space-x-2 bg-green-50 p-2 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600">Đã quyên góp</p>
                            <p className="text-sm text-green-600 truncate">
                              {formatCurrency(campaign.currentAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded">
                          <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600">Mục tiêu</p>
                            <p className="text-sm text-blue-600 truncate">
                              {formatCurrency(campaign.goalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-purple-50 p-2 rounded">
                          <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600">Người ủng hộ</p>
                            <p className="text-sm text-purple-600">
                              {campaign.donations.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* View Donors Button */}
                      {campaign.donations.length > 0 && (
                        <button
                          onClick={() => setSelectedCampaign(campaign)}
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Xem Danh Sách Người Quyên Góp
                        </button>
                      )}
                      {campaign.donations.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-2">
                          Chưa có người quyên góp
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Donors List Dialog */}
      {selectedCampaign && (
        <DonorsListDialog
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </>
  );
}
