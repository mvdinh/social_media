import { useState, useEffect } from "react";
import { Plus, Heart, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import DonateCard from "./DonateCard";
import CreateCampaignDialog from "./CreateCampaignDialog";
import { useAuth } from "../../context/AuthContext";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  creator: string;
}

const DonatePage = () => {
  const { address, contracts } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

        // ✅ FIX: Destructure để truy cập đúng các field
        const [creator, metadata, balance, totalDonations, createdAt, exists] = post;

        // ✅ FIX: Kiểm tra exists bằng biến đã destructure
        if (!exists) {
          console.log("⛔ exists = false → BỎ QUA");
          continue;
        }

        console.log("✅ exists = true");

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

        loadedCampaigns.push({
          id: i.toString(),
          title,
          description,
          goalAmount,
          currentAmount,
          creator: creator,
        });
      }

      console.log("\n🎉 KẾT QUẢ CUỐI:");
      console.log(loadedCampaigns);

      setCampaigns(loadedCampaigns);
    } catch (error) {
      console.error("❌ Error loading campaigns:", error);
      toast.error("Không thể tải danh sách chiến dịch");
    } finally {
      setIsLoading(false);
    }
  };

  // Load campaigns when donateContract is ready
  useEffect(() => {
    if (donateContract) {
      console.log('donateContract: ', donateContract);
      console.log('address: ', address);
      loadCampaigns();
    }
  }, [donateContract, address]);

  const handleDonate = async (campaignId: string, amount: number) => {
    if (!donateContract || !address) {
      toast.error("Vui lòng kết nối ví!");
      return;
    }

    try {
      // Convert amount to Wei (1 ETH = 10^18 Wei)
      const amountInWei = (BigInt(Math.floor(amount * 1e9)) * BigInt(1e9)).toString(); 
      
      // Gọi transaction
      const tx = await donateContract.donate(campaignId, { value: amountInWei });
      
      // Show loading toast
      const promise = tx.wait();
      toast.promise(promise, {
        loading: 'Đang xử lý giao dịch...',
        success: `Đã quyên góp thành công $${amount}!`,
        error: 'Giao dịch thất bại',
      });

      await promise;
      
      // Reload campaigns update số tiền
      loadCampaigns();
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error ("Quyên góp thất bại");
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-blue-600">
  Chiến Dịch Quyên Góp
</h1>


          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cùng nhau chung tay giúp đỡ cộng đồng. Mỗi đóng góp của bạn đều tạo nên sự khác biệt.
          </p>
        </div>

        {/* Create Campaign Button */}
        <div className="mb-10 flex justify-center">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
            Tạo Chiến Dịch Mới
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          // Loading State
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Đang tải dữ liệu từ Blockchain...</p>
          </div>
        ) : campaigns.length > 0 ? (
          // Grid State
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {campaigns.map((campaign) => (
              <DonateCard
                key={campaign.id}
                campaign={campaign}
                onDonate={handleDonate}
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
      </div>
    </div>
  );
}

export default DonatePage;