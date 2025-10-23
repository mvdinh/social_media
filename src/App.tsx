import CreatePost from "./pages/CreatePost";

import Connection from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";

import { Route, Routes } from "react-router-dom";
import Feed from "./pages/Feed";
import Layout from "./pages/Layout";
import CreateStoryModal from "./pages/CreateStory";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Feed />} />
          {/* <Route path="messages" element={<Message />} />
          <Route path="messages/:userId" element={<ChatBox />} /> */}
          <Route path="connections" element={<Connection />} />
          <Route
            path="discover"
            element={<CreateStoryModal onClose={false} />}
          />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
