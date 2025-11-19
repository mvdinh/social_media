import { useState, useEffect } from "react";
import { Plus, Heart, Loader2, Archive } from "lucide-react";
import { toast, Toaster } from "sonner";
import { DonateCard } from "./DonateCard";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { ArchivedCampaignsDialog } from "./ArchivedCampaignsDialog";
import { useAuth } from "../../context/AuthContext";

export interface Donation {
  id: string;
  donorName: string; // Địa chỉ ví
  amount: number;
  date: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  creator: string;
  createdByMe: boolean;
  donations: Donation[];
}

const DonatePage = () => {
  const { address, contracts } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [archivedCampaigns, setArchivedCampaigns] = useState<Campaign[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const donateContract = contracts["donate"];

  // Load campaigns from contract
  const loadCampaigns = async () => {
    if (!donateContract) {
      console.log("⚠️ donateContract NULL");
      return;
    }

    try {
      setIsLoading(true);
      const loadedCampaigns: Campaign[] = [];
      const loadedArchivedCampaigns: Campaign[] = [];

      console.log("🔍 donateContract = ", donateContract);

      let totalPosts;
      try {
        totalPosts = await donateContract.getTotalPosts();
        console.log("📌 totalPosts =", totalPosts.toString());
      } catch (err) {
        console.log("❌ Lỗi getTotalPosts():", err);
        toast.error("Contract không có hàm getTotalPosts()");
        return;
      }

      totalPosts = Number(totalPosts);

      for (let i = 1; i <= totalPosts; i++) {
        console.log(`\n========================`);
        console.log(`📦 ĐANG LOAD POST ID = ${i}`);

        let post;
        try {
          post = await donateContract.posts(i);
        } catch (err) {
          console.log("❌ Lỗi lấy post:", err);
          break;
        }

        console.log("🟦 Raw post data:", post);

        // Destructure để truy cập đúng các field
        const [creator, metadata, balance, totalDonations, createdAt, exists, archived] = post;

        // Kiểm tra exists
        if (!exists) {
          console.log("⛔ exists = false → BỎ QUA");
          continue;
        }

        console.log("✅ exists = true");
        console.log("📦 archived =", archived);

        const metadataParts = metadata ? metadata.split("|") : [];

        const title = metadataParts[0] || "NO TITLE";
        const description = metadataParts[1] || "NO DESC";
        const goalAmount = Number(metadataParts[2] || 0);

        console.log("📝 metadata parse:");
        console.log("   title:", title);
        console.log("   description:", description);
        console.log("   goalAmount:", goalAmount);

        const currentAmount = Number(totalDonations) / 1e18;

        console.log("💰 currentAmount:", currentAmount);
        console.log("👤 creator:", creator);

        // Load donations for this post
        const donations: Donation[] = [];
        try {
          const donationsCount = await donateContract.getDonationsCount(i);
          console.log(`📋 Số lượng donations: ${donationsCount.toString()}`);

          for (let j = 0; j < Number(donationsCount); j++) {
            try {
              const [donorAddress, amount, timestamp] = await donateContract.getDonationEntry(i, j);
              
              donations.push({
                id: `${i}-${j}`,
                donorName: donorAddress, // ✅ Dùng địa chỉ ví làm tên
                amount: Number(amount) / 1e18, // Convert Wei to ETH
                date: new Date(Number(timestamp) * 1000).toISOString(),
              });
            } catch (err) {
              console.log(`❌ Lỗi load donation ${j}:`, err);
            }
          }
        } catch (err) {
          console.log("❌ Lỗi load donations:", err);
        }

        console.log(`✅ Đã load ${donations.length} donations`);

        const campaign: Campaign = {
          id: i.toString(),
          title,
          description,
          goalAmount,
          currentAmount,
          creator: creator,
          createdByMe: address ? creator.toLowerCase() === address.toLowerCase() : false,
          donations,
        };

        // Phân loại archived hay active
        if (archived) {
          loadedArchivedCampaigns.push(campaign);
        } else {
          loadedCampaigns.push(campaign);
        }
      }

      console.log("\n🎉 KẾT QUẢ CUỐI:");
      console.log("Active campaigns:", loadedCampaigns);
      console.log("Archived campaigns:", loadedArchivedCampaigns);

      setCampaigns(loadedCampaigns);
      setArchivedCampaigns(loadedArchivedCampaigns);
    } catch (error) {
      console.error("❌ Error loading campaigns:", error);
      toast.error("Không thể tải danh sách chiến dịch");
    } finally {
      setIsLoading(false);
    }
  };

  // Load campaigns when donateContract is ready
  useEffect(() => {
    if (donateContract && address) {
      console.log('donateContract: ', donateContract);
      console.log('address: ', address);
      loadCampaigns();
    }
  }, [donateContract, address]);

  const handleDonate = async (campaignId: string, donorName: string, amount: number) => {
    if (!donateContract || !address) {
      toast.error("Vui lòng kết nối ví!");
      return;
    }

    try {
      // Convert amount to Wei (1 ETH = 10^18 Wei)
      const amountInWei = (BigInt(Math.floor(amount * 1e9)) * BigInt(1e9)).toString(); 
      
      // ✅ Gọi donate chỉ với campaignId, không cần donorName
      const tx = await donateContract.donate(campaignId, { value: amountInWei });
      
      // Show loading toast
      const promise = tx.wait();
      toast.promise(promise, {
        loading: 'Đang xử lý giao dịch...',
        success: `Đã quyên góp thành công $${amount}!`,
        error: 'Giao dịch thất bại',
      });

      await promise;
      
      // Reload campaigns to update donations list
      loadCampaigns();
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error("Quyên góp thất bại");
    }
  };

  const handleCreateCampaign = async (newCampaign: any) => {
    if (!donateContract || !address) {
      toast.error("Vui lòng kết nối ví!");
      return;
    }

    try {
      // Create metadata string
      const metadata = `${newCampaign.title}|${newCampaign.description}|${newCampaign.goalAmount}`;
      
      const tx = await donateContract.createPost(metadata);
      
      const promise = tx.wait();
      toast.promise(promise, {
        loading: 'Đang tạo chiến dịch...',
        success: 'Chiến dịch đã được tạo thành công!',
        error: 'Tạo chiến dịch thất bại',
      });

      await promise;
      setIsCreateDialogOpen(false);
      loadCampaigns();
    } catch (error: any) {
      console.error("Create campaign error:", error);
      toast.error(error.reason || error.message || "Tạo chiến dịch thất bại");
    }
  };

  const handleArchiveCampaign = async (campaignId: string) => {
    if (!donateContract || !address) {
      toast.error("Vui lòng kết nối ví!");
      return;
    }

    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;

    try {
      const tx = await donateContract.archivePost(campaignId);
      
      const promise = tx.wait();
      toast.promise(promise, {
        loading: 'Đang lưu trữ chiến dịch...',
        success: `"${campaign.title}" đã được lưu trữ!`,
        error: 'Lưu trữ thất bại',
      });

      await promise;
      loadCampaigns();
    } catch (error: any) {
      console.error("Archive error:", error);
      toast.error(error.reason || error.message || "Lưu trữ thất bại");
    }
  };

  const myCampaignsCount = campaigns.filter((c) => c.createdByMe).length;
  const myArchivedCount = archivedCampaigns.filter((c) => c.createdByMe).length;

  // --- RENDER ---

  // 1. Chưa kết nối ví
  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
          <div className="mb-6 bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Kết nối ví để tiếp tục</h2>
          <p className="text-gray-600 mb-6">
            Vui lòng kết nối MetaMask để xem danh sách chiến dịch và thực hiện quyên góp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-center" richColors />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          {/* <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text">
            Chiến Dịch Quyên Góp
          </h1> */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cùng nhau chung tay giúp đỡ cộng đồng. Mỗi đóng góp của bạn đều là một món quà quý giá.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo Chiến Dịch Mới
          </button>

          {myArchivedCount > 0 && (
            <button
              onClick={() => setIsArchivedDialogOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Archive className="mr-2 h-5 w-5" />
              Chiến Dịch Đã Lưu Trữ ({myArchivedCount})
            </button>
          )}
        </div>

        {/* Stats */}
        {myCampaignsCount > 0 && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Bạn đang có{" "}
              <span className="font-semibold text-blue-600">
                {myCampaignsCount}
              </span>{" "}
              chiến dịch đang hoạt động
            </p>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          // Loading State
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Đang tải dữ liệu từ Blockchain...</p>
          </div>
        ) : campaigns.length > 0 ? (
          // Grid State
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {campaigns.map((campaign) => (
              <DonateCard
                key={campaign.id}
                campaign={campaign}
                onDonate={handleDonate}
                onArchive={handleArchiveCampaign}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20 bg-white/50 rounded-2xl backdrop-blur-sm max-w-2xl mx-auto border border-white/60 shadow-sm">
            <div className="mb-4 inline-block p-4 bg-gray-100 rounded-full">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Chưa có chiến dịch nào
            </h3>
            <p className="text-gray-500">
              Hiện tại chưa có dữ liệu trên Blockchain. Hãy là người đầu tiên tạo chiến dịch!
            </p>
          </div>
        )}

        {/* Create Campaign Dialog */}
        {isCreateDialogOpen && (
          <CreateCampaignDialog
            onClose={() => setIsCreateDialogOpen(false)}
            onCreateCampaign={handleCreateCampaign}
          />
        )}

        {/* Archived Campaigns Dialog */}
        {isArchivedDialogOpen && (
          <ArchivedCampaignsDialog
            campaigns={archivedCampaigns.filter((c) => c.createdByMe)}
            onClose={() => setIsArchivedDialogOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default DonatePage;