import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Edit3, Image as ImageIcon, Star } from "lucide-react";
import useWallet from '../wallet/useWallet';

const API_BASE_URL = "http://localhost:3000/api/story"; // Cổng 3000

const MAX_VIDEO_DURATION_SECONDS = 60;

const CreateStoryModal = ({ onClose }) => {
    const { currentAccount, postStory, connectWallet } = useWallet();

    const colorPalette = ["bg-blue-600", "bg-purple-600", "bg-red-500", "bg-pink-500", "bg-green-500", "bg-teal-500"];

    const [statusMessage, setStatusMessage] = useState(null);
    const [storyText, setStoryText] = useState("");
    const [selectedColor, setSelectedColor] = useState("bg-purple-600");
    const [storyType, setStoryType] = useState("Text");
    const [isLoading, setIsLoading] = useState(false);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    
    const baseButtonClass = "flex items-center justify-center py-2 px-4 rounded-lg font-semibold text-sm transition duration-150";
    
    const isVideo = selectedFile && selectedFile.type.startsWith('video/');
    const isImage = selectedFile && selectedFile.type.startsWith('image/');
    
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

    // --- HANDLE SUBMIT ---
    const handleSubmit = async () => {
        if (isLoading) return;
        setStatusMessage(null);

        if (!currentAccount) {
            setStatusMessage("⚠️ Vui lòng kết nối ví MetaMask.");
            await connectWallet();
            return;
        }
        
        // Validate dữ liệu
        if ((storyType === "Text" && !storyText.trim()) || 
            ((storyType === "Photo" || storyType === "Video") && !selectedFile)) {
            return;
        }
        
        setIsLoading(true);

        const formData = new FormData();
        formData.append("owner", currentAccount);
        
        // Backend yêu cầu trường 'type' chính xác (Text, Photo, Video)
        formData.append("type", storyType); 

        try {
            if (storyType === "Video" || storyType === "Photo") {
                // Quan trọng: Field name phải là 'storyFile' khớp với middleware multer ở backend
                formData.append("storyFile", selectedFile); 
            } else {
                formData.append("content", storyText);
                formData.append("backgroundColor", selectedColor);
            }

            // 1. Gọi API Backend để Upload lên IPFS
            const response = await fetch(`${API_BASE_URL}/post`, {
                method: "POST",
                body: formData, // fetch tự động set Content-Type multipart/form-data
            });
            
            const data = await response.json();

            if (!response.ok || !data.ipfsHash) {
                throw new Error(data.error || "Tải lên thất bại.");
            }

            console.log("✅ IPFS Hash:", data.ipfsHash);

            // 2. Gọi Smart Contract để lưu Hash
            // Hàm này lấy từ useWallet, sẽ kích hoạt Metamask
            const txHash = await postStory(data.ipfsHash);
            
            console.log("✅ Transaction Hash:", txHash);

            // 3. Thành công
            onClose();

        } catch (error) {
            console.error("Error creating story:", error);
            if (error.code === 4001 || error.message.includes("user rejected")) {
                setStatusMessage("❌ Bạn đã từ chối giao dịch.");
            } else {
                setStatusMessage(`❌ Lỗi: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    }

    // Cleanup preview
    useEffect(() => {
        if (isVideo && videoRef.current && filePreview) {
            videoRef.current.src = filePreview;
            videoRef.current.load();
        }
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview);
        };
    }, [filePreview, isVideo]);

    // ... (Phần Render UI giữ nguyên) ...
    // Copy phần return từ code gốc của bạn vào đây, 
    // Logic handleSubmit và handleFileChange ở trên đã được sửa.

    return (
      <div className="fixed inset-0 z-50 bg-black/50  flex items-center justify-center p-4">
        {/* ... Code UI cũ ... */}
        {/* Lưu ý: Đảm bảo nút Create Story gọi hàm handleSubmit mới */}
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative">
             {/* Header */}
             <div className="flex items-center p-4 border-b border-gray-100">
                <button onClick={onClose} className="text-gray-600 hover:text-gray-900 transition mr-4">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">Create Story</h2>
             </div>

             <div className="p-6">
                {/* Input File Ẩn */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />

                {/* Preview Area */}
                <div className={`relative h-96 w-full rounded-xl shadow-xl flex items-center justify-center p-6 mb-6 transition-colors ${storyType === "Text" ? selectedColor : "bg-gray-900"}`}>
                    {storyType === "Text" ? (
                        <textarea 
                            className="w-full h-full bg-transparent text-white text-2xl placeholder-white/80 resize-none border-none focus:outline-none text-center pt-16"
                            placeholder="What's on your mind?"
                            maxLength={200}
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                        />
                    ) : (
                        filePreview ? (
                            isVideo ? (
                                <video ref={videoRef} src={filePreview} loop className="h-full w-full object-contain rounded-lg" />
                            ) : (
                                <img src={filePreview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center text-white/80">
                                <ImageIcon className="h-16 w-16 mb-4" />
                                <p className="text-xl font-semibold">Thêm ảnh hoặc video</p>
                                <button onClick={() => fileInputRef.current?.click()} className="mt-6 bg-white/20 text-white px-5 py-2 rounded-full text-base font-bold hover:bg-white/30 transition">
                                    Chọn từ thư viện
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Color Palette (Chỉ hiện khi Text) */}
                {storyType === "Text" && (
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        {colorPalette.map((color, index) => (
                            <div key={index} onClick={() => setSelectedColor(color)} className={`h-6 w-6 rounded-full border-2 border-white cursor-pointer ${color} ${selectedColor === color ? "shadow-lg ring-4 ring-purple-300" : "ring-1 ring-gray-300"}`}></div>
                        ))}
                    </div>
                )}

                {/* Type Selectors */}
                <div className="flex space-x-3 mb-4">
                    <button onClick={() => setStoryType("Text")} className={`${baseButtonClass} flex-1 ${storyType === "Text" ? "bg-purple-100 border border-purple-300 text-purple-700" : "bg-white border border-gray-300 text-gray-700"}`}>
                        <Edit3 className="h-4 w-4 mr-2" /> Text
                    </button>
                    <button onClick={handlePhotoUploadClick} className={`${baseButtonClass} flex-1 ${storyType === "Photo" || storyType === "Video" ? "bg-purple-100 border border-purple-300 text-purple-700" : "bg-gray-100 border border-gray-300 text-gray-700"}`}>
                        <ImageIcon className="h-4 w-4 mr-2" /> Photo/Video
                    </button>
                </div>

                {/* Status Message */}
                {statusMessage && (
                    <p className={`text-center mb-3 text-sm font-medium ${statusMessage.startsWith('❌') ? 'text-red-500' : 'text-gray-600'}`}>
                        {statusMessage}
                    </p>
                )}

                {/* Submit Button */}
                <button 
                    onClick={handleSubmit} 
                    disabled={isLoading || (storyType === "Text" && !storyText.trim()) || ((storyType === "Photo" || storyType === "Video") && !selectedFile)}
                    className={`${baseButtonClass} w-full text-white`}
                    style={{ backgroundImage: "linear-gradient(to right, #6d28d9, #9333ea, #a855f7)" }}
                >
                    <Star className="h-5 w-5 mr-2 fill-white text-white" />
                    {isLoading ? "Đang xử lý..." : "Create Story"}
                </button>
             </div>
        </div>
      </div>
    );
};

export default CreateStoryModal;