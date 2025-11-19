import { useState, useEffect } from "react";
import { DollarSign, X, Wallet } from "lucide-react";

interface DonateDialogProps {
  campaignTitle: string;
  userAddress: string; // ✅ Nhận địa chỉ ví từ props
  onClose: () => void;
  onDonate: (amount: number) => void; // ✅ Không cần donorName nữa
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export function DonateDialog({ campaignTitle, userAddress, onClose, onDonate }: DonateDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleQuickSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      onDonate(amount); // ✅ Chỉ gửi amount
    }
  };

  const isValid = selectedAmount !== null || (customAmount && parseFloat(customAmount) > 0);

  // Format địa chỉ ví: 0x1234...5678
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Quyên Góp</h2>
            </div>
            <p className="text-sm text-gray-600">
              Hỗ trợ cho chiến dịch: <span className="font-medium text-gray-800">{campaignTitle}</span>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Wallet Address Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Địa chỉ ví của bạn</p>
            </div>
            <p className="text-sm text-blue-900 font-mono">{formatAddress(userAddress)}</p>
            <p className="text-xs text-gray-600 mt-1">Giao dịch sẽ được ghi nhận với địa chỉ này</p>
          </div>

          {/* Quick Amount Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Chọn nhanh số tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickSelect(amount)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                    selectedAmount === amount
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-600 shadow-md"
                      : "border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <label htmlFor="custom-amount" className="block text-sm font-medium text-gray-700">
              Hoặc nhập số tiền khác
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="custom-amount"
                type="number"
                placeholder="Nhập số tiền"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>
          </div>

          {/* Current Selection Display */}
          {isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Bạn sẽ quyên góp</p>
              <p className="text-2xl font-bold text-green-600">
                ${selectedAmount || parseFloat(customAmount)}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                isValid
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Xác Nhận Quyên Góp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}