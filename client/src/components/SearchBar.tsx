import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ===================================
// TYPE DEFINITIONS
// ===================================

interface PostResult {
    _id: string;
    content: string;
    owner: { 
        username: string; 
        avatar?: string;
    }; 
    createdAt: string;
    // 💡 THÊM TRƯỜNG NÀY
    mediaUrls?: string[]; // MediaUrls là một mảng chuỗi, có thể không có
}

interface UserResult {
  _id: string;
  address: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface SearchResults {
  users: UserResult[];
  posts: PostResult[];
}

// ===================================
// CONFIG
// ===================================

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api'; 

const SearchBar: React.FC = () => {
  // Khởi tạo state với kiểu dữ liệu đã định nghĩa
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<SearchResults>({ users: [], posts: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // useRef cho debounce timeout
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // ===================================
  // HANDLERS
  // ===================================  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            const query = searchTerm.trim();
            const url = `/search?q=${query}`;
            console.log("Đang chuyển hướng đến:", url); // <-- THÊM LOG NÀY
            setIsOpen(false);
            navigate(url); 
            e.preventDefault(); 
        }
    };

    const handleUserClick = (address: string) => {
        setIsOpen(false);
        navigate(`/profile/${address}`); 
    };

    const handlePostClick = (postId: string) => {
        setIsOpen(false);
        navigate(`/post/${postId}`); 
    };


  // ===================================
  // EFFECTS (DEBOUNCING)
  // ===================================
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const trimmedQuery = searchTerm.trim();
    
    if (!trimmedQuery) {
      setResults({ users: [], posts: [] });
      setIsOpen(false);
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSearchResults(trimmedQuery);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm]);

  // ===================================
  // API CALL
  // ===================================
  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    setIsOpen(true); 
    try {
      // Chỉ định kiểu dữ liệu cho response
      const response = await axios.get<SearchResults>(`${API_BASE_URL}/search`, {
        params: { q: query, limit: 5 } 
      });
      setResults(response.data);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      setResults({ users: [], posts: [] });
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results.users.length > 0 || results.posts.length > 0;

  // ===================================
  // RENDER
  // ===================================
  return (
        <div className="search-container" style={{ position: 'relative' }}>
            
            <input
                type="text"
                className="bg-gray-100 h-10 px-3 pl-10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
                placeholder="Tìm kiếm trên Pingup..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (searchTerm.trim() || hasResults) setIsOpen(true); }}
            />

            {isOpen && (
                <div className="search-results-dropdown"
                    style={{
                        position: 'absolute',
                        zIndex: 1000, 
                        top: '100%',
                        left: 0,
                        width: '100%',
                        minWidth: '300px', 
                        maxHeight: '400px', 
                        overflowY: 'auto', 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
                    }}
                >
                    {loading && <p className="loading-state">Đang tìm kiếm...</p>}

                    {/* HIỂN THỊ KẾT QUẢ NGƯỜI DÙNG */}
                    {results.users.map((user) => (
                        <div 
                            key={user.address} 
                            className="result-item user-result"
                            onClick={() => handleUserClick(user.address)} 
                            style={{ display: 'flex', alignItems: 'center', padding: '8px 15px', cursor: 'pointer' }}
                        >
                            <img 
                                src={user.avatar || '/default-avatar.png'} 
                                alt={user.username} 
                                className="result-icon avatar-icon" 
                                style={{ 
                                    width: '40px', height: '40px', 
                                    borderRadius: '50%', objectFit: 'cover',
                                    marginRight: '12px', flexShrink: 0
                                }}
                            />
                            
                            <div className="info" style={{ flexGrow: 1, minWidth: 0 }}>
                                <p className="title-display" style={{ margin: 0, fontWeight: 600 }}>@{user.username}</p>
                                <small className="subtitle-display" style={{ color: '#606770', fontSize: '0.8rem' }}>Người dùng</small>
                            </div>
                        </div>
                    ))}

                    {/* HIỂN THỊ KẾT QUẢ BÀI ĐĂNG (Thêm Thumbnail Placeholder) */}
                    {results.posts.map((post) => (
                        <div 
                            key={post._id} 
                            className="result-item post-result"
                            onClick={() => handlePostClick(post._id)}
                            // 🚨 CSS: Flex căn giữa, padding
                            style={{ display: 'flex', alignItems: 'center', padding: '8px 15px', cursor: 'pointer' }}
                        >
                            <span 
                                className="result-icon search-icon" 
                                style={{ 
                                    width: '40px', height: '40px', 
                                    borderRadius: '50%', backgroundColor: '#e4e6eb',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontSize: '1.2rem', marginRight: '12px', flexShrink: 0
                                }}
                            >
                                🔍
                            </span>
                            
                            {/* 🚨 CSS: Cho phép text chiếm hết không gian còn lại và không bị tràn */}
                            <div className="info" style={{ flexGrow: 1, minWidth: 0 }}>
                                <p className="title-display post-content-snippet" style={{ margin: 0, fontWeight: 600 }}>
                                    {post.content.substring(0, 30)}...
                                </p>
                                <small className="subtitle-display" style={{ color: '#606770', fontSize: '0.8rem' }}>
                                    Bài đăng từ @{post.owner?.username || 'Người dùng ẩn danh'}
                                </small>
                            </div>
                            
                            {/* 🚨 THUMBNAIL PHẢI: Sử dụng ảnh thumbnail đầu tiên nếu có */}
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <img 
                                    src={post.mediaUrls[0]} 
                                    alt="Thumbnail" 
                                    style={{ 
                                        width: '40px', height: '40px', 
                                        objectFit: 'cover', borderRadius: '4px', 
                                        marginLeft: '10px', flexShrink: 0
                                    }} 
                                />
                            )}
                        </div>
                    ))}

                    {!loading && !hasResults && searchTerm.trim() && (
                        <p className="no-results-state" style={{ padding: '10px 15px', color: '#606770' }}>Không tìm thấy kết quả nào cho "{searchTerm}".</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;