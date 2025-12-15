import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Globe, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useAuth1 } from '../../context/Context';

// 1. Import Hook từ GroupContext (Nơi chứa logic Blockchain + API)


type PrivacyType = 'public' | 'private';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { contracts , user} = useAuth1();
  const groupContract = contracts?.["group"];
  const address = user?.address;
  

  // State Form
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyType>('public');
  const [autoApprove, setAutoApprove] = useState(true); // Lưu ý: Backend cần hỗ trợ field này nếu muốn lưu
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Xử lý Submit Form
  const handleCreate = async () => {
    // Validation cơ bản
    if (!groupName.trim()) return toast.error('Vui lòng nhập tên nhóm');

    // GỌI HÀM TỪ CONTEXT
    // Hàm này sẽ tự động: Ký Metamask -> Đợi Transaction -> Lấy ID -> Gọi API Backend
    const newGroupId = await createGroup({
      name: groupName,
      description: description,
      privacy: privacy.toUpperCase() as 'PUBLIC' | 'PRIVATE',
      imageFile: imageFile
    });

    // Nếu thành công (có ID trả về), chuyển hướng trang
    if (newGroupId) {
      navigate(`/groups/${newGroupId}`);
    }
    // Nếu thất bại, Context đã tự hiện Toast lỗi rồi, không cần làm gì thêm
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
              disabled={isLoading}
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

      {/* Main Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* 1. Ảnh đại diện */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">Ảnh đại diện nhóm</label>
              {imagePreview ? (
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-gray-100 max-h-[300px]">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImagePreview(''); setImageFile(null); }}
                    disabled={isLoading}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium disabled:cursor-not-allowed"
                  >
                    Thay đổi ảnh
                  </button>
                </div>
              ) : (
                <div 
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                    className={`w-full aspect-video max-h-[300px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 transition-colors ${!isLoading ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed'}`}
                >
                  <ImageIcon size={48} className="text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Nhấn để tải ảnh lên</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>

            {/* 2. Tên nhóm */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tên nhóm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Cộng đồng Crypto Việt Nam"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white text-base disabled:bg-gray-100"
                maxLength={75}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{groupName.length}/75</span>
              </div>
            </div>

            {/* 3. Mô tả */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Mô tả nhóm</label>
              <textarea
                placeholder="Mô tả mục đích hoạt động, quy định của nhóm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={4}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none bg-white text-base disabled:bg-gray-100"
                maxLength={500}
              />
            </div>

            {/* 4. Quyền riêng tư */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">Quyền riêng tư <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setPrivacy('public')} 
                  disabled={isLoading}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${privacy === 'public' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <div className={`p-2 rounded-full ${privacy === 'public' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Globe size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            Công khai
                            {privacy === 'public' && <Check size={16} className="text-blue-500" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Bất kỳ ai cũng có thể tìm và xem bài viết.</p>
                    </div>
                </button>

                <button 
                  onClick={() => setPrivacy('private')} 
                  disabled={isLoading}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${privacy === 'private' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <div className={`p-2 rounded-full ${privacy === 'private' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            Riêng tư
                            {privacy === 'private' && <Check size={16} className="text-blue-500" />}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Chỉ thành viên mới xem được nội dung.</p>
                    </div>
                </button>
              </div>
            </div>

            {/* 5. Auto Approve Checkbox */}
            {privacy === 'public' && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input 
                    type="checkbox" 
                    id="autoApprove"
                    checked={autoApprove} 
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    disabled={isLoading} 
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                />
                <label htmlFor="autoApprove" className="cursor-pointer">
                    <div className="font-medium text-gray-900 text-sm">Tự động duyệt thành viên</div>
                    <p className="text-xs text-gray-500 mt-0.5">Người dùng không cần chờ admin phê duyệt để tham gia.</p>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-end gap-3">
            <button 
                onClick={() => navigate('/groups')} 
                disabled={isLoading} 
                className="px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-gray-600 disabled:opacity-50"
            >
                Hủy bỏ
            </button>
            
            <button 
                onClick={handleCreate} 
                disabled={!groupName.trim() || isLoading} 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-medium shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Đang xử lý...</span>
                </>
              ) : (
                'Tạo nhóm'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupPage;