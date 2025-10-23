import { useState } from 'react';
import { api } from '../api';
import '../assets/UploadPost.css';

export default function UploadPost({ onCreated }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return alert('Vui lòng nhập tiêu đề');

        const fd = new FormData();
        fd.append('title', title);
        fd.append('content', content);
        for (const f of files) fd.append('files', f);

        setLoading(true);
        try {
            const { data } = await api.post('/posts', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onCreated?.(data);
            setTitle('');
            setContent('');
            setFiles([]);
        } catch (err) {
            console.error(err);
            alert('Đăng bài thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="upload-post">
            <h3>Đăng bài mới</h3>
            <input
                type="text"
                placeholder="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                placeholder="Nội dung bài viết..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setFiles([...e.target.files])}
            />
            <button disabled={loading}>
                {loading ? 'Đang đăng...' : 'Đăng bài'}
            </button>
        </form>
    );
}
