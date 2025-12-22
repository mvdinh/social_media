import React, { useState, useEffect, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { StoryCard } from "./StoryCard";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewerModal from "./StoryViewerModal";

const StoriesSection = ({ currentUser }) => {
  const [stories, setStories] = useState([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const scrollContainerRef = useRef(null);

  // Fetch stories từ API
  useEffect(() => {
    if (!currentUser) return;

    const fetchStories = async () => {
      try {
        const response = await axiosClient.get("/story");
        setStories(response.data);
      } catch (error) {
        console.error(" Không thể lấy stories từ API:", error);
      } finally {
        setIsLoadingStories(false);
      }
    };

    fetchStories();
  }, [isCreateStoryOpen, currentUser]);

  // Check scroll position
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [stories]);

  // Scroll handlers
  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Handlers
  const handleViewStory = (storyMetadata) => {
    const index = stories.findIndex(
      s => s._id === storyMetadata._id || s.ipfsHash === storyMetadata.ipfsHash
    );
    if (index !== -1) {
      setViewingStoryIndex(index);
    }
  };

  const handleCloseViewer = () => setViewingStoryIndex(null);

  const handleNextStory = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex < stories.length - 1) {
      setViewingStoryIndex(viewingStoryIndex + 1);
    }
  };

  const handlePrevStory = () => {
    if (viewingStoryIndex !== null && viewingStoryIndex > 0) {
      setViewingStoryIndex(viewingStoryIndex - 1);
    }
  };

  const currentStory = viewingStoryIndex !== null ? stories[viewingStoryIndex] : null;

  return (
    <>
      {/* Stories Container với Navigation */}
      <div className="relative">
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>

        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Stories Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-4 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Nút tạo Story */}
          <div
            onClick={() => setIsCreateStoryOpen(true)}
            className="relative flex-shrink-0 w-[120px] h-[200px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
          >
            <div className="absolute inset-0 bg-white flex flex-col shadow-md">
              {/* Phần ảnh trên (70%) */}
              <div className="h-[70%] w-full relative overflow-hidden">
                <img 
                  src={currentUser?.avatar} 
                  alt="Me" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              </div>
              
              {/* Phần nút bấm dưới (30%) */}
              <div className="h-[30%] w-full relative bg-white flex flex-col items-center justify-end pb-2">
                {/* Nút cộng tròn đè lên ranh giới */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:bg-blue-700 transition-colors">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-800 text-xs font-bold">Tạo tin</span>
              </div>
            </div>
          </div>

          {/* Danh sách Story từ Backend */}
          {isLoadingStories ? (
            <div className="flex items-center justify-center w-full h-[200px] text-gray-400">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <span className="text-sm">Loading stories...</span>
              </div>
            </div>
          ) : (
            stories.map((story) => (
              <StoryCard
                key={story._id || story.ipfsHash}
                user={currentUser}
                media_url={story.url}
                content={story.content}
                type={story.type}
                backgroundColor={story.backgroundColor}
                onClick={() => handleViewStory(story)}
              />
            ))
          )}
        </div>
      </div>

      {/* MODAL: CREATE STORY */}
      {isCreateStoryOpen && (
        <CreateStoryModal 
          onClose={() => setIsCreateStoryOpen(false)} 
        />
      )}

      {/* MODAL: VIEW STORY */}
      {currentStory && (
        <StoryViewerModal
          story={currentStory}
          stories={stories}
          currentIndex={viewingStoryIndex}
          onClose={handleCloseViewer}
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}
    </>
  );
};

export default StoriesSection;