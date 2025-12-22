import React, { useState, useEffect, useRef } from "react";
import { X, Edit3, Image as ImageIcon, Star } from "lucide-react";
import axiosClient from '../../api/axiosClient';

const MAX_VIDEO_DURATION_SECONDS = 60;

const CreateStoryModal = ({ onClose }) => {
  const colorPalette = [
    "bg-blue-600", 
    "bg-purple-600", 
    "bg-red-500", 
    "bg-pink-500", 
    "bg-green-500", 
    "bg-teal-500"
  ];

  const [statusMessage, setStatusMessage] = useState(null);
  const [storyText, setStoryText] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-600");
  const [storyType, setStoryType] = useState("Text");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  
  const baseButtonClass = "flex items-center justify-center py-2 px-3 rounded-lg font-semibold text-sm transition duration-150";
  const isVideo = selectedFile && selectedFile.type.startsWith('video/');
  
  // Handlers
  const handlePhotoUploadClick = () => {
    setStoryType("Photo");
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = function() {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > MAX_VIDEO_DURATION_SECONDS) {
          alert(`Video quá dài. Tối đa ${MAX_VIDEO_DURATION_SECONDS}s.`);
          event.target.value = '';
          setSelectedFile(null);
          setFilePreview(null);
        } else {
          setSelectedFile(file);
          setStoryType("Video");
          if (filePreview) URL.revokeObjectURL(filePreview);
          setFilePreview(URL.createObjectURL(file));
        }
      };
      videoElement.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(file);
      setStoryType("Photo");
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setStatusMessage(null);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStatusMessage("⚠️ Bạn chưa đăng nhập. Vui lòng Sign In lại.");
      return;
    }
    
    if ((storyType === "Text" && !storyText.trim()) || 
        ((storyType === "Photo" || storyType === "Video") && !selectedFile)) {
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    formData.append("type", storyType); 

    try {
      if (storyType === "Video" || storyType === "Photo") {
        formData.append("storyFile", selectedFile); 
      } else {
        formData.append("content", storyText);
        formData.append("backgroundColor", selectedColor);
      }

      const response = await axiosClient.post("/story/create", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { success, story } = response.data;

      if (!success) throw new Error("Tải lên thất bại.");

      console.log("✅ Story Created:", story);
      onClose();

    } catch (error) {
      console.error("Error creating story:", error);
      
      let msg = "Lỗi không xác định";
      if (error.response?.data?.error) msg = error.response.data.error;
      else if (error.message) msg = error.message;
      
      setStatusMessage(`❌ ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Tạo tin mới</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,video/*" 
          />

          {/* Preview Area */}
          <div className={`relative h-60 w-full rounded-xl shadow-inner flex items-center justify-center p-4 mb-4 transition-colors overflow-hidden ${storyType === "Text" ? selectedColor : "bg-gray-900"}`}>
            {storyType === "Text" ? (
              <>
                <textarea 
                  className="w-full h-full bg-transparent text-white text-xl font-medium placeholder-white/70 resize-none border-none focus:outline-none text-center flex items-center justify-center pt-8 pb-8 custom-scrollbar"
                  placeholder="Bạn đang nghĩ gì?"
                  maxLength={200}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                />
                {/* Color Palette */}
                <div className="absolute bottom-3 flex space-x-2 z-10 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
                  {colorPalette.map((color, index) => (
                    <div 
                      key={index} 
                      onClick={() => setSelectedColor(color)} 
                      className={`h-5 w-5 rounded-full border border-white/50 cursor-pointer transition-transform hover:scale-110 ${color} ${selectedColor === color ? "ring-2 ring-white scale-110" : ""}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              filePreview ? (
                isVideo ? (
                  <video 
                    ref={videoRef} 
                    src={filePreview} 
                    loop 
                    autoPlay 
                    muted 
                    className="h-full w-full object-contain" 
                  />
                ) : (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="h-full w-full object-contain" 
                  />
                )
              ) : (
                <div 
                  onClick={handlePhotoUploadClick}
                  className="flex flex-col items-center justify-center text-white/60 cursor-pointer hover:text-white transition"
                >
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <p className="text-sm font-medium">Chọn ảnh/video</p>
                </div>
              )
            )}
          </div>

          {/* Type Buttons */}
          <div className="flex space-x-2 mb-3">
            <button 
              onClick={() => setStoryType("Text")} 
              className={`${baseButtonClass} flex-1 ${storyType === "Text" ? "bg-purple-50 border border-purple-200 text-purple-700" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Edit3 className="h-4 w-4 mr-2" /> Văn bản
            </button>
            <button 
              onClick={handlePhotoUploadClick} 
              className={`${baseButtonClass} flex-1 ${storyType === "Photo" || storyType === "Video" ? "bg-purple-50 border border-purple-200 text-purple-700" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Ảnh/Video
            </button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <p className={`text-center mb-2 text-xs font-medium ${statusMessage.startsWith('❌') ? 'text-red-500' : 'text-gray-500'}`}>
              {statusMessage}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 shrink-0 bg-white">
          <button 
            onClick={handleSubmit} 
            disabled={isLoading || (storyType === "Text" && !storyText.trim()) || ((storyType === "Photo" || storyType === "Video") && !selectedFile)}
            className={`${baseButtonClass} w-full text-white shadow-md hover:shadow-lg transform active:scale-95`}
            style={{ backgroundImage: "linear-gradient(to right, #7c3aed, #9333ea)" }}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2 fill-white" />
                Chia sẻ tin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;