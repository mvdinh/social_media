import { useState, useEffect } from "react";
import { DollarSign, X, Wallet, CreditCard } from "lucide-react";

interface DonateDialogProps {
  campaignTitle: string;
  userAddress: string;
  onClose: () => void;
  onDonate: (amount: number) => void;
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
      onDonate(amount);
    }
  };

  const isValid = selectedAmount !== null || (customAmount && parseFloat(customAmount) > 0);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const currentAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog Container - Tăng max-width lên 2xl để chứa 2 cột */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header - Full Width */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Quyên Góp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Grid Layout for 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-0">
            
            {/* LEFT COLUMN: Info & Summary */}
            <div className="p-6 bg-gray-50 border-r border-gray-100 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Campaign Info */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Chiến dịch</p>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    {campaignTitle}
                  </h3>
                </div>

                {/* Wallet Info */}
                <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-700">Ví nguồn</p>
                  </div>
                  <p className="text-sm text-blue-900 font-mono bg-blue-50 px-3 py-1.5 rounded-md inline-block">
                    {formatAddress(userAddress)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Giao dịch blockchain sẽ được thực hiện từ địa chỉ này.
                  </p>
                </div>
              </div>

              {/* Live Summary (Hiển thị to ở cột trái) */}
              <div className="mt-6 md:mt-0">
                 <div className={`p-5 rounded-xl border transition-all duration-300 ${isValid ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng quyên góp</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
                        ${currentAmount > 0 ? currentAmount : "0.00"}
                      </span>
                    </div>
                 </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Inputs & Actions */}
            <div className="p-6 flex flex-col h-full">
              <div className="space-y-6 flex-1">
                {/* Quick Select */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <CreditCard className="h-4 w-4" /> Chọn mức ủng hộ
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickSelect(amount)}
                        className={`px-2 py-3 rounded-xl border transition-all duration-200 font-bold text-sm ${
                          selectedAmount === amount
                            ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-200 scale-105"
                            : "border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Nhập số tiền tùy chỉnh"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className={`block w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none transition-colors font-medium ${
                        customAmount ? 'border-green-500 ring-4 ring-green-500/10' : 'border-gray-200 focus:border-green-500'
                      }`}
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform duration-200 flex items-center justify-center gap-2 ${
                    isValid
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:-translate-y-0.5 shadow-green-200"
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  {isValid ? "Xác nhận & Gửi" : "Vui lòng chọn số tiền"}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}