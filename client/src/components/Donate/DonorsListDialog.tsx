import { useEffect } from "react";
import { Campaign } from "./DonatePage";
import { X, Users, Download, Calendar, DollarSign } from "lucide-react";
import * as XLSX from "xlsx";

interface DonorsListDialogProps {
  campaign: Campaign;
  onClose: () => void;
}

export function DonorsListDialog({ campaign, onClose }: DonorsListDialogProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleExportToExcel = () => {
    // Prepare data for Excel
    const excelData = campaign.donations.map((donation, index) => ({
      "STT": index + 1,
      "Tên người quyên góp": donation.donorName,
      "Số tiền (USD)": donation.amount,
      "Ngày quyên góp": formatDate(donation.date),
    }));

    // Add summary row
    excelData.push({
      "STT": "",
      "Tên người quyên góp": "TỔNG CỘNG",
      "Số tiền (USD)": campaign.currentAmount,
      "Ngày quyên góp": "",
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },  // STT
      { wch: 30 }, // Tên
      { wch: 15 }, // Số tiền
      { wch: 20 }, // Ngày
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách quyên góp");

    // Add campaign info sheet
    const infoData = [
      { "Thông tin": "Tên chiến dịch", "Chi tiết": campaign.title },
      { "Thông tin": "Mô tả", "Chi tiết": campaign.description },
      { "Thông tin": "Mục tiêu", "Chi tiết": `$${campaign.goalAmount}` },
      { "Thông tin": "Đã quyên góp", "Chi tiết": `$${campaign.currentAmount}` },
      { "Thông tin": "Số người quyên góp", "Chi tiết": campaign.donations.length },
      { "Thông tin": "Tiến độ", "Chi tiết": `${((campaign.currentAmount / campaign.goalAmount) * 100).toFixed(1)}%` },
    ];
    const infoSheet = XLSX.utils.json_to_sheet(infoData);
    infoSheet["!cols"] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Thông tin chiến dịch");

    // Generate filename
    const filename = `Danh_sach_quyen_gop_${campaign.title.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  const totalDonations = campaign.donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h2 className="text-gray-900">Danh sách người quyên góp</h2>
            </div>
            <p className="text-sm text-gray-600">{campaign.title}</p>
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
            <p className="text-sm text-gray-600">Tổng người quyên góp</p>
            <p className="text-purple-600">{campaign.donations.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Tổng tiền</p>
            <p className="text-green-600">{formatCurrency(totalDonations)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Tiến độ</p>
            <p className="text-blue-600">
              {((campaign.currentAmount / campaign.goalAmount) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Content - Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6">
          {campaign.donations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có ai quyên góp cho chiến dịch này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaign.donations.map((donation, index) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 truncate">{donation.donorName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{formatDate(donation.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 ml-4">
                    <DollarSign className="h-4 w-4" />
                    <span className="whitespace-nowrap">{donation.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={campaign.donations.length === 0}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white transition-all duration-200 ${
              campaign.donations.length > 0
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
