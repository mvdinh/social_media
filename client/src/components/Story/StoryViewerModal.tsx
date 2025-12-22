import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const StoryViewerModal = ({ 
  story, 
  stories,
  currentIndex,
  onClose, 
  onNext, 
  onPrev,
  isLoading
}) => {
  const [reactionCounts, setReactionCounts] = useState({});
  const videoRef = useRef(null);

  const isFirst = currentIndex === 0;
  const isLast = stories && currentIndex === stories.length - 1;

  // Fetch Reaction Counts
  useEffect(() => {
    const fetchReactionCounts = async () => {
      if (!story || !story.ipfsHash) return;
      try {
        const response = await axiosClient.get(`story/reactions/${story.ipfsHash}`);
        if (response.data) {
          setReactionCounts(response.data);
        }
      } catch (error) {
        console.error("Error fetching reaction counts:", error);
        setReactionCounts({});
      }
    };
    fetchReactionCounts();
    return () => setReactionCounts({});
  }, [story]);

  // Handle Reaction - CHO PHÉP REACT NHIỀU LẦN
  const handleReactionClick = async (emoji) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("⚠️ Vui lòng đăng nhập để thả cảm xúc!");
      return;
    }

    if (!story || !story.ipfsHash) return;

    try {
      const response = await axiosClient.post("story/react", {
        storyHash: story.ipfsHash,
        reactionType: emoji
      });

      const data = response.data;

      if (data.success) {
        // Update UI ngay lập tức - Tăng thêm 1
        setReactionCounts(prev => ({
          ...prev,
          [emoji]: (prev[emoji] || 0) + 1
        }));
      }
    } catch (error) {
      console.error("Lỗi Reaction:", error);
      const msg = error.response?.data?.error || "Lỗi kết nối";
      alert(`❌ ${msg}`);
    }
  };

  if (isLoading || !story) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Xác định loại story
  const isTextStory = story.type === 'story-text' || story.type === 'Text';
  const isVideo = story.type && (story.type === 'Video' || story.type.includes('video'));
  const isImage = story.type && (story.type === 'Photo' || story.type.includes('photo'));
  const isMedia = isVideo || isImage;
  
  const backgroundColorClass = isMedia ? 'bg-black' : story.backgroundColor || 'bg-gray-800';
  const displayname = story.user?.username || story.user?.full_name || 
                      (story.owner ? `${story.owner.slice(0, 6)}...${story.owner.slice(-4)}` : "Unknown");

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      {/* Prev Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }} 
        disabled={isFirst} 
        className={`absolute left-4 z-50 p-2 bg-white/10 rounded-full text-white ${isFirst ? 'opacity-30' : 'hover:bg-white/20'}`}
      >
        <ChevronLeft size={32} />
      </button>

      {/* Main Content */}
      <div 
        className={`relative w-full max-w-md h-[85vh] flex flex-col rounded-xl overflow-hidden ${backgroundColorClass}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-start">
          <div className="text-white">
            <p className="font-bold text-sm">{displayname}</p>
            <p className="text-xs opacity-80">
              {story.createdAt ? new Date(story.createdAt).toLocaleString() : ''}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:opacity-70"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center bg-black w-full h-full overflow-hidden">
          {isVideo ? (
            <video 
              ref={videoRef} 
              src={story.url || story.media_url} 
              controls 
              className="max-h-full max-w-full object-contain" 
            />
          ) : isImage ? (
            <img 
              src={story.url || story.media_url} 
              alt="Story" 
              className="max-h-full max-w-full object-contain" 
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center p-6 text-center ${story.backgroundColor || 'bg-purple-600'}`}>
              <p className="text-white text-2xl font-bold break-words">
                {story.content}
              </p>
            </div>
          )}
        </div>

        {/* Footer Reactions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="flex justify-center gap-4">
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
              <button 
                key={emoji} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleReactionClick(emoji); 
                }}
                className="text-3xl hover:scale-125 transition-transform relative group"
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
      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }} 
        disabled={isLast} 
        className={`absolute right-4 z-50 p-2 bg-white/10 rounded-full text-white ${isLast ? 'opacity-30' : 'hover:bg-white/20'}`}
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
};

export default StoryViewerModal;