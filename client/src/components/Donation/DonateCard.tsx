import { useState } from "react";
import { Campaign } from "./DonatePage";
import  DonateDialog  from "./DonateDialog";
import { Heart, Target, TrendingUp } from "lucide-react";

interface DonateCardProps {
  campaign: Campaign;
  onDonate: (campaignId: string, amount: number) => void;
}

const DonateCard = ({ campaign, onDonate }) => {
  const [isDonateDialogOpen, setIsDonateDialogOpen] = useState(false);

  const progressPercentage = Math.min(
    (campaign.currentAmount / campaign.goalAmount) * 100,
    100
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleDonateSubmit = async (campaignId, amount) => {
    await onDonate(campaignId, amount);
    setIsDonateDialogOpen(false);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 pb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-white">{campaign.title}</h3>
              <p className="text-blue-50 text-sm">{campaign.description}</p>
              {campaign.onChain && (
                <span className="inline-block mt-2 px-2 py-1 bg-white/20 rounded text-xs">
                  On-Chain
                </span>
              )}
            </div>
            <Heart className="h-6 w-6 text-white opacity-80 flex-shrink-0 ml-4" />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{progressPercentage.toFixed(1)}% hoàn thành</span>
              <span className={progressPercentage >= 100 ? "text-green-600 font-medium" : "text-gray-600"}>
                {progressPercentage >= 100 ? "✓ Đạt mục tiêu!" : ""}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start space-x-3 bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Đã quyên góp</p>
                <p className="font-bold text-green-600 truncate">{formatCurrency(campaign.currentAmount)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600">Mục tiêu</p>
                <p className="font-bold text-blue-600 truncate">{formatCurrency(campaign.goalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => setIsDonateDialogOpen(true)}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200"
          >
            <Heart className="mr-2 h-4 w-4" />
            Quyên Góp Ngay
          </button>
        </div>
      </div>

      {isDonateDialogOpen && (
        <DonateDialog
          campaignTitle={campaign.title}
          campaignId={campaign.id}
          onClose={() => setIsDonateDialogOpen(false)}
          onDonate={handleDonateSubmit}
        />
      )}
    </>
  );
}

export default DonateCard;