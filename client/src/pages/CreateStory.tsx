  import React, { useState, useEffect, useRef } from "react";
  import { ArrowLeft, Edit3, Image as ImageIcon, Star } from "lucide-react";

  import useWallet from '../wallet/useWallet';

  const MAX_VIDEO_DURATION_SECONDS = 60; // giới hạn thời lượng video

  const CreateStoryModal = ({ onClose }) => {
    // Lấy trạng thái ví và hàm postStory từ Context
    const { 
        currentAccount, 
        postStory, 
        connectWallet 
    } = useWallet();

    const colorPalette = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-red-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-teal-500",
    ];

    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    //quản lý state
    const [storyText, setStoryText] = useState("");
    const [selectedColor, setSelectedColor] = useState("bg-purple-600"); // Mặc định màu tím như ảnh
    const [storyType, setStoryType] = useState("Text"); // Mặc định là 'Text'
    const [isLoading, setIsLoading] = useState(false); // Trạng thái loading khi gọi API
    
    //Thêm state để lưu file đã chọn và link preview
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null); // Dùng để hiển thị preview

    //Tạo ref cho input[type=file] bị ẩn
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Tạo ref mới cho thẻ video
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const baseButtonClass =
      "flex items-center justify-center py-2 px-4 rounded-lg font-semibold text-sm transition duration-150";
    
    const isVideo = selectedFile && selectedFile.type.startsWith('video/');
    const isImage = selectedFile && selectedFile.type.startsWith('image/');
    
    //Hàm này được gọi khi bấm nút "Photo/Video"
    const handlePhotoUploadClick = () => {
      setStoryType("Photo");
      // Kích hoạt sự kiện click của input bị ẩn
      fileInputRef.current?.click();
    };

    //Hàm này được gọi khi người dùng đã chọn file xong
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]; // Lấy file đầu tiên

      if (file) {
        if (file.type.startsWith('video/')) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata'; // Chỉ tải metadata

            videoElement.onloadedmetadata = function() {
                window.URL.revokeObjectURL(videoElement.src); // Dọn dẹp URL tạm thời

                // ✅ 1.1: KIỂM TRA THỜI LƯỢNG
                if (videoElement.duration > MAX_VIDEO_DURATION_SECONDS) {
                    alert(`Video quá dài (${videoElement.duration.toFixed(1)}s). Chỉ cho phép video dưới ${MAX_VIDEO_DURATION_SECONDS} giây.`);
                    
                    // Reset input để người dùng chọn lại
                    event.target.value = '';
                    setSelectedFile(null);
                    setFilePreview(null);
                    return; 
                } else {
                    // ✅ 1.2: VIDEO HỢP LỆ (Dưới 60s)
                    setSelectedFile(file);
                    setStoryType("Video");
                    if (filePreview) URL.revokeObjectURL(filePreview);
                    const previewUrl = URL.createObjectURL(file);
                    setFilePreview(previewUrl);
                }
            };
            
            // Kích hoạt onloadedmetadata bằng cách gán file URL
            videoElement.src = URL.createObjectURL(file);
            
        } else {
          setSelectedFile(file); // Lưu file vào state
          setStoryType("Photo"); // Tự động chuyển sang chế độ Photo
          if (filePreview) URL.revokeObjectURL(filePreview); // Cleanup cũ nếu có
          // Tạo một URL tạm thời để hiển thị preview ảnh
          const previewUrl = URL.createObjectURL(file);
          setFilePreview(previewUrl);
        }
      }
    };

    // Xử lý submit tạo story
    const handleSubmit = async () => {
      if (isLoading) return;
      setStatusMessage(null);

      // KIỂM TRA KẾT NỐI VÍ TRƯỚC
      if (!currentAccount) {
          setStatusMessage("⚠️ Vui lòng kết nối ví MetaMask trước khi đăng Story.");
          await connectWallet(); // Thử kết nối nếu chưa có
          return;
      }
      
      if (
        (storyType === "Text" && storyText.trim() === "") ||
        (storyType === "Photo" && !selectedFile) ||
        (storyType === "Video" && !selectedFile)
      ) return; // Không làm gì nếu không hợp lệ
      
      setIsLoading(true); 

      const formData = new FormData();
      formData.append("owner", currentAccount); // <-- Cung cấp tên người dùng
      formData.append("timestamp", Date.now().toString());

      try {
        if (storyType === "Video") {
          // ---  XỬ LÝ UPLOAD video ---
          formData.append("type", "Video");
          formData.append("storyFile", selectedFile!); 
        } else if (storyType === "Photo") {
          // ---  XỬ LÝ UPLOAD ẢNH ---
          formData.append("type", "Photo");
          formData.append("storyFile", selectedFile!); 
        } else {
          // --- Thêm dữ liệu cho Text story ---
          formData.append("type", "Text");
          formData.append("content", storyText);
          formData.append("backgroundColor", selectedColor);
        }
          // URL trỏ đến API mà chúng ta đã tạo
          const response = await fetch("http://localhost:5000/post", {
            method: "POST",
            body: formData,
          });
          
          const data = await response.json();

          if (!response.ok || !data.ipfsHash) {
            throw new Error("Tải ảnh lên thất bại.");
          }

          const txHash = await postStory(data.ipfsHash);

        // Đóng modal sau khi thành công
        onClose();
  
      } catch (error: any) {
          console.error("Error creating story:", error);
          if (error.code === 4001) {
                setStatusMessage("❌ Giao dịch bị người dùng từ chối trên MetaMask.");
          } else {
                setStatusMessage(`❌ Lỗi giao dịch: ${error.message || "Không xác định"}`);
          }
      } finally {
          setIsLoading(false);
      }
    }

    // Hàm cleanup này sẽ chạy khi component bị hủy
    useEffect(() => {
      if (isVideo && videoRef.current && filePreview) {
          // Đặt lại source và cố gắng phát
          videoRef.current.src = filePreview;
          videoRef.current.load();
          videoRef.current.play().catch(error => {
                // Lỗi thường xảy ra nếu người dùng chưa tương tác với trang
                console.warn("Video play was prevented by browser:", error);
          });
      }

      return () => {
        if (filePreview) {
          URL.revokeObjectURL(filePreview);
        }
      };
    }, [filePreview, isVideo]); // Chạy khi filePreview hoặc isVideo thay đổi

    return (
      <div className="fixed inset-0 z-50 bg-black/50  flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative">
          <div className="flex items-center p-4 border-b border-gray-100">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition mr-4"
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Create Story</h2>
          </div>

          <div className="p-6">
            {/* Story Preview/Input Area (Màu Tím đậm) */}
            <input type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" // Ẩn nó đi
              accept="image/*,video/*" // Chỉ chấp nhận ảnh và video
            />
            <div
              className={`relative h-96 w-full rounded-xl shadow-xl flex items-center justify-center p-6 mb-6 transition-colors ${
                storyType === "Text" ? selectedColor : "bg-gray-900" // <-- Dùng selectedColor để đổi màu nền
              }`}
            >
              {storyType === "Text" ? (
              <textarea
                className="w-full h-full bg-transparent text-white text-2xl placeholder-white/80 resize-none border-none focus:outline-none text-center pt-16"
                placeholder="What's on your mind?"
                maxLength={200} // Giới hạn ký tự
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />
              ) : (
                filePreview ? (
                  // Hiển thị preview ảnh/video đã chọn
                  isVideo ? (
                     <video
                        ref={videoRef}
                        src={filePreview}
                        //controls
                        //autoPlay
                        loop
                        //muted // Mute để tự động phát
                        className="h-full w-full object-contain rounded-lg"
                     />
                  ) : isImage ? (
                  <img
                    src={filePreview}
                    alt="Story preview"
                    className="h-full w-full object-contain rounded-lg" // 'object-contain' để ảnh không bị vỡ
                  />
                  ) : (
                    // Fallback nếu có lỗi file
                    <p className="text-white">Unsupported file type selected.</p>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/80">
                    <ImageIcon className="h-16 w-16 mb-4" />
                    <p className="text-xl font-semibold">Thêm ảnh hoặc video</p>
                    <button
                      className="mt-6 bg-white/20 text-white px-5 py-2 rounded-full text-base font-bold hover:bg-white/30 transition"
                      // Nút này cũng dùng để mở cửa sổ chọn file
                      onClick={() => fileInputRef.current?.click()} 
                    >
                      Chọn từ thư viện
                    </button>
                  </div>
                )
              )
            }
            </div>

            <div className="flex items-center justify-center space-x-3 mb-6">
              {colorPalette.map((color, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`h-6 w-6 rounded-full border-2 border-white cursor-pointer ${color} ${
                    selectedColor === color
                      ? "shadow-lg ring-4 ring-purple-300"
                      : "ring-1 ring-gray-300" // Màu active là màu tím
                  }`}
                ></div>
              ))}
            </div>

            <div className="flex space-x-3 mb-4">
              {/* Nút Text */}
              <button
                onClick={() => setStoryType("Text")}
                className={`${baseButtonClass} flex-1 ${
                  storyType === "Text"
                    ? "bg-purple-100 border border-purple-300 text-purple-700"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Text
              </button>

              <button
                onClick={handlePhotoUploadClick}
                className={`${baseButtonClass} flex-1 ${
                  storyType === "Photo"
                    ? "bg-purple-100 border border-purple-300 text-purple-700"
                    : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Photo/Video
              </button>
            </div>

            {statusMessage && (
                <p className={`text-center mb-3 text-sm font-medium ${statusMessage.startsWith('❌') ? 'text-red-500' : statusMessage.startsWith('✅') ? 'text-green-500' : 'text-gray-600'}`}>
                    {statusMessage}
                </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                (storyType === "Text" && storyText.trim() === "") ||
                (storyType === "Photo" && !selectedFile)    // Disable nếu chưa làm gì
              }
              className={`${baseButtonClass} w-full text-white`}
              style={{
                backgroundImage:
                  "linear-gradient(to right, #6d28d9, #9333ea, #a855f7)",
              }}
            >
              <Star className="h-5 w-5 mr-2 fill-white text-white" />
              {isLoading ? "Đang tạo..." : "Create Story"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  export default CreateStoryModal;
