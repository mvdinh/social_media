import { Route, Routes, Navigate } from "react-router-dom";
import Connection from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
import PostFeed from "./Test/ListPosts";

import CreatePost from "./components/Post/CreatePost"
import FriendsPage  from "./components/Relationship/FriendsPage";
import DonatePage from "./components/Donate/DonatePage";
import ListPost from "./components/Post/ListPost";
import FriendsListPage from "./components/Friend/FriendListPage"

function App() {
  return (
    <Routes>
    
      {/* Mặc định mở app là /login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Trang login */}
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Layout />}>
        <Route path="feed" element={<ListPost />} />
        <Route path="connections" element={<Connection />} />
        <Route path="discover" element={<CreateStoryModal onClose={false} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="friends/requests" element={<FriendsPage/>}/>
        <Route path="friends" element={<FriendsListPage/>}/>
        <Route path="donation" element={<DonatePage/>}/>
     </Route>
    </Routes>
  );
}

export default App;
