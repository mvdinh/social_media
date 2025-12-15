import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout'; // Giả sử bạn sử dụng Layout cho các trang chính

// ===================================
// TYPE DEFINITIONS (Tái sử dụng từ SearchBar.tsx)
// ===================================

interface UserResult {
  _id: string;
  address: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface PostAuthor {
  username: string;
  avatar?: string;
}

interface PostResult {
  _id: string;
  content: string;
  authorAddress: PostAuthor; 
  createdAt: string;
}

interface SearchResults {
  users: UserResult[];
  posts: PostResult[];
}

// ===================================
// CONFIG
// ===================================
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'; 

// ===================================
// COMPONENT
// ===================================

const SearchResultsPage: React.FC = () => {
  // 1. Đọc từ khóa tìm kiếm từ URL query (e.g., /search?q=keyword)
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || ''; // Lấy giá trị của 'q'

  const [results, setResults] = useState<SearchResults>({ users: [], posts: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm gọi API tìm kiếm
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<SearchResults>(`${API_BASE_URL}/api/search`, {
        params: { q: searchQuery } 
        // LƯU Ý: Nếu bạn muốn kết quả đầy đủ (không giới hạn 10), bạn phải 
        // điều chỉnh logic giới hạn (.limit(10)) ở Backend controller.
      });
      setResults(response.data);
    } catch (err) {
      console.error("Lỗi khi tải trang kết quả:", err);
      setError("Không thể tải kết quả tìm kiếm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Gọi API khi component mount hoặc query thay đổi
  useEffect(() => {
    // Chỉ gọi API nếu có từ khóa tìm kiếm
    if (query.trim()) {
      fetchResults(query.trim());
    } else {
      setLoading(false);
    }
  }, [query, fetchResults]);

  // ===================================
  // RENDER HIỂN THỊ
  // ===================================
  
  const totalResults = results.users.length + results.posts.length;

  // Sử dụng Layout để giữ thanh điều hướng và header
  return (
      <div className="search-results-page">
        <h2 className="page-title">
          Kết quả tìm kiếm cho: 
          <span className="query-display"> "{query}"</span>
        </h2>
        
        {loading && <p className="loading-state">Đang tải kết quả...</p>}
        {error && <p className="error-state">{error}</p>}

        {!loading && !error && (
          <>
            {/* 3. Hiển thị thông báo không có kết quả */}
            {totalResults === 0 && (
              <div className="no-results-message">
                <p>Chúng tôi không tìm thấy kết quả nào khớp với "{query}".</p>
              </div>
            )}

            {/* 4. Hiển thị Kết quả Người dùng */}
            {results.users.length > 0 && (
              <section className="results-section">
                <h3>Người dùng ({results.users.length})</h3>
                <div className="user-list">
                  {results.users.map(user => (
                    <UserCard key={user.address} user={user} /> // Dùng Component con
                  ))}
                </div>
              </section>
            )}

            {/* 5. Hiển thị Kết quả Bài đăng */}
            {results.posts.length > 0 && (
              <section className="results-section">
                <h3>Bài đăng ({results.posts.length})</h3>
                <div className="post-list">
                  {results.posts.map(post => (
                    <PostPreview key={post._id} post={post} /> // Dùng Component con
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
  );
};

export default SearchResultsPage;