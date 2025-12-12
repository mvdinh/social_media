import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { ethers } from "ethers";

const API_BASE_URL = "http://localhost:3000/api/story";

// Cấu hình EIP-712 (Phải KHỚP 100% với Backend)
const EIP712_DOMAIN = {
    name: "Story DApp",
    version: "1",
    chainId: 11155111 // Sepolia (hoặc chainId mạng bạn đang dùng)
};

const EIP712_TYPES = {
    Reaction: [
        { name: "storyHash", type: "string" },
        { name: "reactionType", type: "string" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "string" }
    ]
};

const StoryViewerModal = ({ 
    story, 
    onClose, 
    stories, 
    currentIndex, 
    onNext, 
    onPrev, 
    isLoading,
    currentUserAddress // Đảm bảo props này được truyền vào từ parent
}) => {
    // Giả sử useAuth cung cấp provider hoặc signer
    const { address } = useAuth(); 
    const effectiveUserAddress = currentUserAddress || address;

    const [reactionCounts, setReactionCounts] = useState({});
    const videoRef = useRef(null);

    const isFirst = currentIndex === 0;
    const isLast = stories && currentIndex === stories.length - 1;

    // 1. Fetch Reaction Counts
    useEffect(() => {
        const fetchReactionCounts = async () => {
            if (!story || !story.ipfsHash) return;

            try {
                const response = await fetch(`${API_BASE_URL}/reactions/${story.ipfsHash}`);
                if (response.ok) {
                    const counts = await response.json();
                    setReactionCounts(counts);
                } else {
                    setReactionCounts({});
                }
            } catch (error) {
                console.error("Error fetching reaction counts:", error);
            }
        };

        fetchReactionCounts();
        return () => setReactionCounts({});
    }, [story]);

    // 2. Handle Reaction (Logic EIP-712)
    const handleReactionClick = async (emoji) => {
        if (!effectiveUserAddress) return alert("⚠️ Vui lòng kết nối ví!");
        if (!story || !story.ipfsHash) return alert("⚠️ Không thể xác định Story.");

        try {
            // A. Khởi tạo Provider & Signer
            if (!window.ethereum) return alert("Cài Metamask đi bạn!");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // B. Lấy Nonce từ Backend
            const nonceRes = await fetch(`${API_BASE_URL}/nonce`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: effectiveUserAddress })
            });
            const nonceData = await nonceRes.json();
            if (!nonceData.success) throw new Error("Không thể tạo Nonce");
            
            const nonce = nonceData.nonce;
            const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp (seconds)

            // C. Ký EIP-712
            // Lưu ý: Ethers v6 dùng signTypedData (không có _), v5 dùng _signTypedData
            const signature = await signer.signTypedData(
                EIP712_DOMAIN,
                EIP712_TYPES,
                {
                    storyHash: story.ipfsHash,
                    reactionType: emoji,
                    timestamp: timestamp,
                    nonce: nonce
                }
            );

            // D. Gửi lên Backend
            const reactRes = await fetch(`${API_BASE_URL}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyHash: story.ipfsHash,
                    reactorAddress: effectiveUserAddress,
                    reactionType: emoji,
                    timestamp: timestamp,
                    nonce: nonce,
                    signature: signature,
                    chainId: EIP712_DOMAIN.chainId
                }),
            });

            const data = await reactRes.json();

            if (reactRes.ok && data.success) {
                // E. Cập nhật UI (Optimistic Update)
                setReactionCounts(prev => ({
                    ...prev,
                    [emoji]: data.currentCount
                }));
            } else {
                throw new Error(data.error || "Lỗi server.");
            }

        } catch (error) {
            console.error("Lỗi Reaction:", error);
            // Xử lý lỗi user từ chối ký
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                // Không làm gì, user tự hủy
            } else {
                alert(`❌ Thất bại: ${error.message}`);
            }
        }
    };

    // ... (Phần render UI giữ nguyên như cũ, chỉ thay logic handleReactionClick) ...
    // Các phần Loading, Error, Video logic giữ nguyên

    if (isLoading || !story) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">Loading...</div>;

    const isTextStory = story.type === 'story-text';    
    const isVideo = story.type && story.type.includes('video'); 
    const isImage = story.type && story.type.includes('photo') && !isVideo;
    const isMedia = isVideo || isImage;
    const backgroundColorClass = isMedia ? 'bg-black' : story.backgroundColor || 'bg-gray-800';
    const displayname = story.name || "Unknown";

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
            {/* Prev Button */}
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }} disabled={isFirst} className={`absolute left-4 z-50 p-2 bg-white/10 rounded-full text-white ${isFirst ? 'opacity-30' : 'hover:bg-white/20'}`}>
                <ChevronLeft size={32} />
            </button>

            {/* Main Content */}
            <div className={`relative w-full max-w-md h-[85vh] flex flex-col rounded-xl overflow-hidden ${backgroundColorClass}`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-start">
                    <div className="text-white">
                        <p className="font-bold text-sm">{displayname}</p>
                        <p className="text-xs opacity-80">{story.datePinned ? new Date(story.datePinned).toLocaleString() : ''}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:opacity-70"><X /></button>
                </div>

                {/* Body */}
                <div className="flex-1 flex items-center justify-center bg-black">
                    {isVideo ? (
                        <video ref={videoRef} src={story.url} controls className="max-h-full w-full object-contain" />
                    ) : isImage ? (
                        <img src={story.url} alt="Story" className="max-h-full w-full object-contain" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center p-6 text-center ${story.backgroundColor || 'bg-purple-600'}`}>
                            <p className="text-white text-2xl font-bold">{story.content}</p>
                        </div>
                    )}
                </div>

                {/* Footer Reactions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                    <div className="flex justify-center gap-4">
                        {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                            <button 
                                key={emoji} 
                                onClick={(e) => { e.stopPropagation(); handleReactionClick(emoji); }}
                                className="text-3xl hover:scale-125 transition-transform relative"
                            >
                                {emoji}
                                {reactionCounts[emoji] > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
                                        {reactionCounts[emoji]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Next Button */}
            <button onClick={(e) => { e.stopPropagation(); onNext(); }} disabled={isLast} className={`absolute right-4 z-50 p-2 bg-white/10 rounded-full text-white ${isLast ? 'opacity-30' : 'hover:bg-white/20'}`}>
                <ChevronRight size={32} />
            </button>
        </div>
    );
};

export default StoryViewerModal;