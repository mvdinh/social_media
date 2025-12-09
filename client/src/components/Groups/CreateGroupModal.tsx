import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Globe, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadTextToIpfs, uploadFileToIpfs } from '../../helper/UploadToIpfs';
import { toast, Toaster } from 'sonner';

type PrivacyType = 'public' | 'private';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyType>('public');
  const [autoApprove, setAutoApprove] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    if (!address) {
      toast.error('Vui lòng kết nối ví');
      return;
    }
    if (!groupContract) {
      toast.error('Contract chưa được khởi tạo');
      return;
    }

    setIsCreating(true);
    const loadingToast = toast.loading('Đang chuẩn bị tạo nhóm...');

    try {
      // BƯỚC 1: Upload tên nhóm lên IPFS (CID của text)
      toast.loading('📝 Đang mã hóa tên nhóm lên IPFS...', { id: loadingToast });
      const nameCID = await uploadTextToIpfs(groupName.trim());
      console.log('✅ Name CID:', nameCID);

      // BƯỚC 2: Upload mô tả lên IPFS (CID của text)
      toast.loading('📝 Đang mã hóa mô tả lên IPFS...', { id: loadingToast });
      const descCID = description.trim() 
        ? await uploadTextToIpfs(description.trim())
        : await uploadTextToIpfs('Không có mô tả'); // Fallback nếu không có mô tả
      console.log('✅ Description CID:', descCID);

      // BƯỚC 3: Upload ảnh lên IPFS (nếu có)
      let coverImageCID = '';
      if (imageFile) {
        toast.loading('🖼️ Đang tải ảnh lên IPFS...', { id: loadingToast });
        coverImageCID = await uploadFileToIpfs(imageFile);
        console.log('✅ Cover Image CID:', coverImageCID);
      } else {
        // Nếu không có ảnh, upload một placeholder text
        coverImageCID = await uploadTextToIpfs('no-image');
        console.log('✅ Using placeholder CID for no image');
      }

      // BƯỚC 4: Tạo nhóm trên blockchain với các CID
      const groupType = privacy === 'public' ? 0 : 1;

      toast.loading('⛓️ Đang tạo nhóm trên blockchain...', { id: loadingToast });
      console.log('📡 Sending transaction with:', {
        nameCID,
        descCID,
        groupType,
        autoApprove,
        coverImageCID
      });

      const tx = await groupContract.createGroup(
        nameCID,        // CID của name
        descCID,        // CID của description
        groupType,
        autoApprove,
        coverImageCID   // CID của ảnh
      );

      console.log('📝 Transaction sent:', tx.hash);
      toast.loading('⏳ Đang chờ xác nhận giao dịch...', { id: loadingToast });
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // Lấy groupId từ event
      const event = receipt.events?.find((e: any) => e.event === 'GroupCreated');
      const groupId = event?.args?.groupId?.toString();

      console.log('🎉 Group created with ID:', groupId);
      toast.success('Tạo nhóm thành công! 🎉', { id: loadingToast });

      if (groupId) {
  setTimeout(() => {
    navigate(`/groups/joins`);
  }, 1500);
}


    } catch (error: any) {
      console.error('❌ Error creating group:', error);
      let errorMessage = 'Tạo nhóm thất bại';
      
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Bạn đã từ chối giao dịch';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Số dư không đủ để thực hiện giao dịch';
      } else if (error.message?.includes('Cannot connect to IPFS')) {
        errorMessage = 'Không thể kết nối IPFS. Vui lòng kiểm tra IPFS Desktop';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/groups')}
              disabled={isCreating}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo nhóm mới</h1>
              <p className="text-sm text-gray-500">Tạo không gian riêng cho cộng đồng của bạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Group Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Ảnh đại diện nhóm
              </label>
              {imagePreview ? (
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    disabled={isCreating}
                    className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm disabled:cursor-not-allowed"
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                  <ImageIcon size={48} className="text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">Chưa có ảnh đại diện</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isCreating}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                Tải ảnh lên
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Chọn ảnh đại diện cho nhóm của bạn. Kích thước đề xuất: 400x400px (Tối đa 5MB)
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tên nhóm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Cộng đồng Blockchain Việt Nam"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isCreating}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={75}
                autoFocus
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">Chọn tên rõ ràng, dễ tìm kiếm</p>
                <span className="text-sm text-gray-400">{groupName.length}/75</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Mô tả nhóm
              </label>
              <textarea
                placeholder="Mô tả mục đích, nội dung và quy định của nhóm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={5}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none bg-white text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-gray-400">{description.length}/500</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Quyền riêng tư <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-4">
                {/* Public Option */}
                <button
                  onClick={() => setPrivacy('public')}
                  disabled={isCreating}
                  className={`p-5 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed ${
                    privacy === 'public'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        privacy === 'public' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <Globe
                        size={24}
                        className={privacy === 'public' ? 'text-blue-600' : 'text-gray-500'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-base">Công khai</span>
                        {privacy === 'public' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={14} strokeWidth={3} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Bất kỳ ai cũng có thể tìm thấy nhóm, xem thành viên và bài viết. Phù hợp cho cộng đồng mở.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Private Option */}
                <button
                  onClick={() => setPrivacy('private')}
                  disabled={isCreating}
                  className={`p-5 rounded-xl border-2 transition-all text-left disabled:cursor-not-allowed ${
                    privacy === 'private'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        privacy === 'private' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <Lock
                        size={24}
                        className={privacy === 'private' ? 'text-blue-600' : 'text-gray-500'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-base">Riêng tư</span>
                        {privacy === 'private' && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={14} strokeWidth={3} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Chỉ thành viên mới xem được nội dung nhóm. Cần phê duyệt để tham gia.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Auto Approve Setting */}
            {privacy === 'public' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    disabled={isCreating}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      Tự động chấp nhận thành viên
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Người dùng có thể tham gia ngay lập tức mà không cần phê duyệt
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => navigate('/groups')}
              disabled={isCreating}
              className="px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || isCreating}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold shadow-sm flex items-center gap-2"
            >
              {isCreating && <Loader2 size={18} className="animate-spin" />}
              <span>{isCreating ? 'Đang tạo...' : 'Tạo nhóm'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;