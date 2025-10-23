import { useState } from 'react';
import UploadPost from './components/UploadPost';
import PostList from './components/PostList';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2>IPFS Social Feed (Demo)</h2>
      <UploadPost onCreated={() => setRefreshKey((k) => k + 1)} />
      <div key={refreshKey}>
        <PostList />
      </div>
    </div>
  );
}