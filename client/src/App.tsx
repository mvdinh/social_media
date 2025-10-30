import { Route, Routes, Navigate } from "react-router-dom";
import CreatePost from "./pages/CreatePost/CreatePost";
import Connection from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Login from "./pages/Login/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
import CheckCreatePost from "./pages/CreatePost/CheckCreatePost";
import LikeButton from "./pages/CreatePost/a";

function App() {
  return (
    <Routes>
      {/* Mặc định mở app là /login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Trang login */}
      <Route path="/login" element={<Login />} />

      {/* Các route bình thường */}
      <Route path="/" element={<Layout />}>
        <Route path="feed" element={<Feed />} />
        <Route path="connections" element={<Connection />} />
        <Route path="discover" element={<CreateStoryModal onClose={false} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="like" element={<CheckCreatePost/>} />
      </Route>
    </Routes>
  );
}

export default App;
