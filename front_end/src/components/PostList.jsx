import { useEffect, useState } from 'react';
import { api } from '../api';
import '../assets/PostList.css';

function MediaView({ media }) {
    if (!media) return null;
    return (
        <div className="media-view">
            {media.map((m, idx) => {
                const isImg = m.mimeType?.startsWith('image/');
                const isVid = m.mimeType?.startsWith('video/');
                if (isImg) return <img key={idx} src={m.url} alt={m.name} />;
                if (isVid) return <video key={idx} src={m.url} controls />;
                return (
                    <a key={idx} href={m.url} target="_blank" rel="noreferrer">
                        {m.name || m.cid}
                    </a>
                );
            })}
        </div>
    );
}

function CommentBox({ onSubmit }) {
    const [text, setText] = useState('');
    return (
        <div className="comment-box">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Viết bình luận..."
            />
            <button
                onClick={() => {
                    onSubmit(text);
                    setText('');
                }}
            >
                Gửi
            </button>
        </div>
    );
}

export default function PostList() {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const load = async (p = 1) => {
        const { data } = await api.get(`/posts?page=${p}&limit=${limit}`);
        setPosts(data.data);
        setTotal(data.total);
        setPage(data.page);
    };

    useEffect(() => {
        load(1);
    }, []);

    const like = async (id) => {
        await api.post(`/posts/${id}/like`);
        load(page);
    };

    const comment = async (id, text) => {
        if (!text.trim()) return;
        await api.post(`/posts/${id}/comments`, { text });
        load(page);
    };

    const totalPages = Math.ceil(total / limit) || 1;

    return (
        <div className="post-list">
            {posts.map((p) => (
                <div key={p.id} className="post-card">
                    <h4>{p.title}</h4>
                    <p>{p.content}</p>
                    <MediaView media={p.media} />
                    <div style={{ marginTop: 8 }}>
                        <button className="like-button" onClick={() => like(p.id)}>
                            👍 Like ({p.likes})
                        </button>
                    </div>
                    <div className="comment-section">
                        <strong>Bình luận</strong>
                        <ul className="comment-list">
                            {p.comments?.map((c) => (
                                <li key={c._id || c.createdAt}>
                                    {c.author || 'Ẩn danh'}: {c.text}
                                </li>
                            ))}
                        </ul>
                        <CommentBox onSubmit={(text) => comment(p.id, text)} />
                    </div>
                </div>
            ))}

            <div className="pagination">
                <button disabled={page <= 1} onClick={() => load(page - 1)}>
                    Prev
                </button>
                <span>
                    Page {page}/{totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => load(page + 1)}>
                    Next
                </button>
            </div>
        </div>
    );
}
