import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import useWallet from '../wallet/useWallet';

/**
 * Component hiển thị Story toàn màn hình (Modal)
 * @param {object} props.story - Dữ liệu Story đã fetch từ Backend/IPFS.
 * @param {function} props.onClose - Hàm đóng modal.
 * @param {array} props.stories - Danh sách toàn bộ stories.
 * @param {number} props.currentIndex - Index của story hiện tại.
 * @param {function} props.onNext - Hàm chuyển story tiếp theo.
 * @param {function} props.onPrev - Hàm chuyển story trước đó.
 */
const StoryViewerModal = ({ 
    story, 
    onClose, 
    stories, 
    currentIndex, 
    onNext, 
    onPrev, 
    isLoading,
    currentUserAddress
}) => {

    const { getSigner } = useWallet();

    const [reactionCounts, setReactionCounts] = useState({});

    const videoRef = useRef(null);

    const isFirst = currentIndex === 0;
    const isLast = stories && currentIndex === stories.length - 1;

    useEffect(() => {
        const fetchReactionCounts = async () => {
            if (!story || !story.ipfsHash) return;

            try {
                // Gọi endpoint mới GET /reactions/:storyHash
                const response = await fetch(`http://localhost:5000/reactions/${story.ipfsHash}`);
                
                if (response.ok) {
                    const counts = await response.json();
                    setReactionCounts(counts);
                } else {
                    console.error("Failed to fetch reaction counts:", response.statusText);
                    setReactionCounts({});
                }
            } catch (error) {
                console.error("Error fetching reaction counts:", error);
                setReactionCounts({});
            }
        };

        fetchReactionCounts();
        
        return () => setReactionCounts({});
        
    }, [story]);
    
    // Nếu đang tải hoặc chưa có dữ liệu, hiển thị placeholder
    if (isLoading || !story) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">
                <div className="spinner"></div> 
                <p>{story && story.error ? story.error : 'Đang tải nội dung Story...'}</p>
                <button onClick={onClose} className="absolute top-4 right-4 text-xl">X</button>
            </div>
        );
    }

    // Nếu có lỗi sau khi tải
    if (story.error) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white p-4" onClick={onClose}>
                <div className="bg-red-900/80 p-8 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Lỗi tải Story</h2>
                    <p>{story.error}</p>
                    <button onClick={onClose} className="mt-4 bg-white text-red-900 px-3 py-1 rounded">Đóng</button>
                </div>
            </div>
        );
    }

    if (!story) return null;

    const isTextStory = story.type === 'story-text';    
    const isVideo = story.type.includes('video'); 
    const isImage = story.type.includes('photo') && !isVideo;
    const isMedia = isVideo || isImage;
    const backgroundColorClass = isMedia ? 'bg-black' : story.backgroundColor || 'bg-gray-800';
    const displayname = story.name ? story.name.length > 30 ? story.name.substring(0, 30) + "..." : story.name : "Unknown name";

    // Hàm định dạng thời gian hiển thị
    const timeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);

        const diffMs = now - past;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        // Tính số ngày chính xác
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return "Vừa xong";
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    const displayTime = story.datePinned ? timeAgo(story.datePinned) : "N/A";

    const reactions = ['👍', '❤️', '😱', '😂', '😮', '😢', '😡'];

    const handleReactionClick = async (emoji) => {
        const storyHash = story.ipfsHash; 
        
        if (!currentUserAddress) {
            alert("⚠️ Vui lòng kết nối ví!");
            return;
        }

        const signer = getSigner();
        const message = `Reacting ${emoji} to Story ${storyHash}`;
        
        let signature;
        try {
            signature = await signer.signMessage(message);
        } catch (error) {
            alert("Người dùng đã từ chối giao dịch ký.");
            return;
        }

        if (!storyHash) {
            alert("⚠️ Không thể xác định Story.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/react", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyHash: storyHash, 
                    reactorAddress: currentUserAddress,
                    reactionType: emoji,
                    signature: signature,
                    message: message
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // CẬP NHẬT STATE BỘ ĐẾM CỤC BỘ TỪ MONGODB: { currentCount: N, reactionType: "emoji" }
                setReactionCounts(prevCounts => ({
                    ...prevCounts,
                    [data.reactionType]: data.currentCount // Cập nhật bộ đếm cho loại emoji vừa gửi
                }));
                
            } else {
                throw new Error(data.error || "Lỗi server.");
            }
        } catch (error) {
            console.error("Lỗi khi gửi:", error);
            alert(`❌ Gửi thất bại: ${error.message}`);
        }
    };

    useEffect(() => {
        if (isVideo && videoRef.current && story.url) {
            videoRef.current.src = story.url;
            videoRef.current.load(); // Load lại source
            videoRef.current.play().catch(error => {
                // Autoplay bị chặn
                console.warn("Autoplay blocked by browser policy:", error);
            });
        }
        return () => {
            if (story.url) {
            URL.revokeObjectURL(story.url);
            }
        };
    }, [story.url, isVideo]);
    
    return (
        <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" 
            onClick={onClose} // Bấm ra ngoài đóng modal
        >
            {/* NÚT CHUYỂN TRƯỚC (PREVIOUS) */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }} // Ngăn chặn đóng modal
                disabled={isFirst}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 text-white transition-opacity ${
                    isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80 hover:scale-110'
                }`}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
                // Container chính của Story
                className={`relative w-full max-w-sm md:max-w-md h-5/6 max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl ${backgroundColorClass}`}
                onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click ra ngoài
            >
                {/* Header (Thông tin người đăng và thời gian) */}
                <div className="p-3 flex items-center justify-between text-white">
                    <div className="text-sm">
                        <span className="font-semibold">{displayname}</span>
                        <br/>
                        <span className="ml-2 text-xs opacity-75">{displayTime}</span>
                    </div>
                    <button onClick={onClose} className="text-lg font-bold opacity-75 hover:opacity-100 transition">
                        &times; {/* Dấu X */}
                    </button>
                </div>

                {/* Nội dung chính (Ảnh/Video hoặc Text) */}
                <div 
                    className={`flex-1 flex items-center justify-center p-4 
                        ${isTextStory ? backgroundColorClass : 'bg-black'}
                        h-full w-full`} 
                >
                    {isVideo ? (
                        <video 
                            ref={videoRef}
                            src={story.url} 
                            controls 
                            //autoPlay 
                            loop 
                            className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg"
                        >
                        </video>                            
                    ): isImage ? (
                        <img 
                            src={story.url} // URL từ Pinata Gateway
                            alt="Story Content" 
                            className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg"
                        />
                    ) : isTextStory ? (
                        <p className="text-white text-3xl font-extrabold text-center p-6 whitespace-pre-wrap">
                            {/* Nội dung Text được lấy từ metadata contentSnippet hoặc nội dung đầy đủ */}
                            {story.content || story.contentSnippet}
                        </p>
                    ) : (
                        <p className="text-white">Không tìm thấy nội dung media.</p>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }} // Ngăn chặn đóng modal
                disabled={isLast}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-2 rounded-full bg-black/50 text-white transition-opacity ${
                    isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/80 hover:scale-105'
                }`}
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Footer (Reactions) */}
            <div className="absolute bottom-0 left-0 right-0 z-50 p-3 flex justify-center w-full">
                <div className="flex items-center w-full max-w-md px-4">
                    
                    {/* Ô Gửi Tin Nhắn (Input) */}
                    <input
                        type="text"
                        placeholder="Gửi tin nhắn..."
                        className="flex-1 px-4 py-2 mr-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-full focus:outline-none focus:border-white transition"
                        onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng modal khi gõ
                    />
                    
                    {/* Reactions Icons */}
                    <div className="flex space-x-2">
                        {reactions.map((emoji, index) => (
                            <button
                                key={index}
                                className={`text-2xl relative transition-transform transform hover:scale-125 focus:outline-none ${index < 2 ? 'bg-white rounded-full p-1' : ''}`}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleReactionClick(emoji);
                                }}
                                title={`Gửi reaction: ${emoji}`}
                            >
                                {emoji}
                                {/* HIỂN THỊ SỐ LƯỢNG */}
                                {reactionCounts[emoji] > 0 && (
                                    <span className="absolute top-[-14px] right-[-14px] text-xs font-bold bg-red-600 text-white rounded-full px-1.5 py-0.5 pointer-events-none border-2 border-white z-10">
                                        {reactionCounts[emoji]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StoryViewerModal;