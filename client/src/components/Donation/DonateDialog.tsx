import { useState, useEffect } from "react";
import { DollarSign, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface DonateDialogProps {
  campaignTitle: string;
  onClose: () => void;
  onDonate: (amount: number) => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const DonateDialog = ({ campaignTitle, campaignId, onClose, onDonate }) => {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const {address} = useAuth();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleQuickSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = selectedAmount || parseFloat(customAmount);
    if (amount && amount > 0) {
      setIsProcessing(true);
      try {
        await onDonate(campaignId, amount);
        onClose();
      } catch (error) {
        console.error("Donation failed:", error);
        alert("Quyên góp thất bại: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const isValid = selectedAmount !== null || (customAmount && parseFloat(customAmount) > 0);

  if (!address) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <p className="text-center text-gray-700">Vui lòng kết nối ví để quyên góp!</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Quyên Góp</h2>
            </div>
            <p className="text-sm text-gray-600">
              Hỗ trợ cho chiến dịch: <span className="font-medium text-gray-800">{campaignTitle}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Chọn nhanh số tiền</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickSelect(amount)}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                    selectedAmount === amount
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-600"
                      : "border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

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
                disabled={isProcessing}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                min="1"
                step="1"
              />
            </div>
          </div>

          {isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Bạn đang quyên góp</p>
              <p className="text-2xl font-bold text-green-600">
                ${selectedAmount || parseFloat(customAmount)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid || isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-all duration-200 ${
                isValid && !isProcessing
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isProcessing ? "Đang xử lý..." : "Xác Nhận Quyên Góp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DonateDialog;