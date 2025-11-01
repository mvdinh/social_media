  import React, { useState, useEffect, useRef } from "react";
  import { ArrowLeft, Edit3, Image as ImageIcon, Star } from "lucide-react";

  const CreateStoryModal = ({ onClose }) => {
    const colorPalette = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-red-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-teal-500",
    ];
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
    
    const baseButtonClass =
      "flex items-center justify-center py-2 px-4 rounded-lg font-semibold text-sm transition duration-150";
    
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
        setSelectedFile(file); // Lưu file vào state
        setStoryType("Photo"); // Tự động chuyển sang chế độ Photo

        // Tạo một URL tạm thời để hiển thị preview ảnh
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
      }
    };

    // Xử lý submit tạo story
    const handleSubmit = async () => {
      if (isLoading) return;

      if (
        (storyType === "Text" && storyText.trim() === "") ||
        (storyType === "Photo" && !selectedFile)
      ) return; // Không làm gì nếu không hợp lệ
      
      setIsLoading(true); 

      const formData = new FormData();
      formData.append("owner", "your_username_here"); // <-- Cung cấp tên người dùng
      formData.append("timestamp", Date.now().toString());

      try {
        if (storyType === "Photo") {
          // ---  XỬ LÝ UPLOAD ẢNH ---
          formData.append("type", "Photo");
          formData.append("storyFile", selectedFile!); // Key này phải khớp với API (upload.single("storyFile"))
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

          if (!response.ok) {
            throw new Error("Tải ảnh lên thất bại.");
          }

        // Đóng modal sau khi thành công
        onClose();
      } catch (error) {
        console.error("Error creating story:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Hàm cleanup này sẽ chạy khi component bị hủy
    useEffect(() => {
      return () => {
        if (filePreview) {
          URL.revokeObjectURL(filePreview);
        }
      };
    }, [filePreview]);

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
                  <img
                    src={filePreview}
                    alt="Story preview"
                    className="h-full w-full object-contain rounded-lg" // 'object-contain' để ảnh không bị vỡ
                  />
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
