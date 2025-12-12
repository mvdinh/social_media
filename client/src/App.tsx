import { Route, Routes, Navigate } from "react-router-dom";
import Connection from "./pages/Connections";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
import PostFeed from "./Test/ListPosts";

import FriendsPage from "./components/Relationship/FriendsPage";
import DonatePage from "./components/Donate/DonatePage";

import FriendsListPage from "./components/Friend/FriendListPage";

import GroupPage from "./components/Groups/GroupPage";
import JoinPage from "./components/Groups/JoinPage/JoinPage";
import CreateGroupModal from "./components/Groups/CreateGroupModal";
import GroupFeed from "./components/Groups/GroupFeed";
import GroupDetail from "./components/Groups/GroupDetail";
import ListPostPage from "./pages/ListPostPage";



function App() {
  return (

    <Routes>

      {/* Redirect mặc định */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Layout chính */}
      <Route path="/" element={<Layout />}>

        {/* <Route path="feed" element={<ListPostPage/>} /> */}
        <Route path="feed" element={<Feed/>} />
        <Route path="groups" element={<Connection />} />  {/* cái này hình như cũ rồi */}
        <Route path="discover" element={<CreateStoryModal onClose={false} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="friends/requests" element={<FriendsPage />} />
        <Route path="friends" element={<FriendsListPage />} />
        <Route path="donation" element={<DonatePage />} />

        {/* ✅ Route nhóm (KHÔNG cần LayoutGroup) */}
        <Route path="groups">
          {/* <Route path="feed" element={<GroupPage />} /> */}
          <Route path="joins" element={<JoinPage />} />
          <Route path="create" element={<CreateGroupModal/>} />
          <Route path=":id" element={<GroupDetail/>} />
        </Route>

      </Route>
    </Routes>

  );
}

export default App;
