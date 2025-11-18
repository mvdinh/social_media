import { Route, Routes, Navigate } from "react-router-dom";
import Connection from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
import PostFeed from "./Test/ListPosts";
import CreatePost from "./components/CreatePost"

//  
import { mockFriendRequests } from "./components/Friend/mockData";

import FriendsPage  from "./components/ListFriend/FriendsPage";
import { mockFriends } from "./components/Friend/mockData";

import Fr from './views/FrientTest'
import FriendTest from "./views/FrientTest";
import FriendPage from "./components/FriendPage";
import DonationPage from "./components/Donation/DonatePage";
function App() {
  return (
    <Routes>
    
      {/* Mặc định mở app là /login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Trang login */}
      <Route path="/login" element={<Login />} />
      <Route path="/fr" element={<FriendTest />} />

      {/* Các route bình thường */}
      <Route path="/" element={<Layout />}>
        <Route path="feed" element={<Feed />} />
        <Route path="connections" element={<Connection />} />
        <Route path="discover" element={<CreateStoryModal onClose={false} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        {/* <Route path="addfriend" element={<FriendRequestsPage requests={mockFriendRequests} />} /> */}
        <Route path="friends" element={<FriendsPage/>}/>
        <Route path="donation" element={<DonationPage/>}/>


        {/* Test */}
        <Route path="feed-tet" element={<PostFeed/>} />
     </Route>
    </Routes>
  );
}

export default App;
