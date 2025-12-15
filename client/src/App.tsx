import { Route, Routes, Navigate } from "react-router-dom";
import Connection from "./pages/Connections";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
// import PostFeed from "./Test/ListPosts"; // Commented out in your code

import FriendsPage from "./components/Relationship/FriendsPage";
import DonatePage from "./components/Donate/DonatePage";
import FriendsListPage from "./components/Friend/FriendListPage";

// Group Components
import JoinPage from "./components/Groups/JoinPage/JoinPage";
import CreateGroupModal from "./components/Groups/CreateGroupModal";
import GroupDetail from "./components/Groups/GroupDetail";
// import GroupPage from "./components/Groups/GroupPage";
import ChatPage from "./pages/Chat/ChatPage"
import { GroupProvider } from "./context/GroupContext";

function App() {
  const address = localStorage.getItem("userAddress") || "{}";
  const id =localStorage.getItem("id") || "{}";

  const me = {
    address: address|| "",
    userId: id || "",
  };
  return (
    <Routes>
      {/* Redirect mặc định */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* ✅ Bọc GroupProvider ở đây để TOÀN BỘ các trang bên trong Layout 
         đều có thể gọi useGroup() mà không bị lỗi.
      */}
      <Route 
        element={
          <GroupProvider>
            <Layout />
          </GroupProvider>
        }
      >
        {/* Các Route con nằm trong Layout (Outlet) */}
        <Route path="feed" element={<Feed />} />
        
        {/* Route cũ của bạn */}
        <Route path="groups" element={<Connection />} /> 
        <Route path="messages" element={<ChatPage me={me} />} />
        <Route path="discover" element={<CreateStoryModal onClose={() => {}} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        
        <Route path="friends/requests" element={<FriendsPage />} />
        <Route path="friends" element={<FriendsListPage />} />
        <Route path="donation" element={<DonatePage />} />

        {/* ✅ Route cho Groups (Viết phẳng ra cho dễ quản lý) */}
        <Route path="groups/joins" element={<JoinPage />} />
        <Route path="groups/create" element={<CreateGroupModal />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        
      </Route> 
      {/* Kết thúc Route Layout */}

    </Routes>
  );
}

export default App;