import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CreatePost from "./pages/CreatePost/CreatePost";
import Connection from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Login from "./pages/Login/Login";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";
import CheckCreatePost from "./pages/CreatePost/CheckCreatePost";
import GetAllPost from "./pages/GetAllPost";
import ChatPage from "./pages/chat/ChatPage";

export default function App() {
  const wallet = JSON.parse(localStorage.getItem("wallet") || "{}");

  const me = {
    address: wallet.address || "",
    userId: wallet.userId || "",
  };




  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Layout />}>
        <Route path="feed" element={<Feed />} />
        <Route path="connections" element={<Connection />} />
        <Route path="discover" element={<CreateStoryModal onClose={false} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:profileId" element={<Profile />} />
        <Route path="create-post" element={<CreatePost />} />
        <Route path="all-post" element={<GetAllPost />} />
        <Route path="like" element={<CheckCreatePost />} />
        <Route path="messages" element={<ChatPage me={me} />} />
      </Route>
    </Routes>
  );
}
