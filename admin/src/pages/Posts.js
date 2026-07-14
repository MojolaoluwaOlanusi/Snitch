import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/posts?limit=100')
            .then(({ data }) => setPosts(data))
            .catch(() => toast.error('Failed to load posts'))
            .finally(() => setLoading(false));
    }, []);
    const deletePost = async (id) => {
        if (!window.confirm('Delete this post?'))
            return;
        try {
            await api.delete(`/posts/delete/${id}`);
            toast.success('Post deleted');
            setPosts((prev) => prev.filter((p) => p._id !== id));
        }
        catch (err) {
            toast.error('Failed to delete');
        }
    };
    if (loading)
        return _jsx("div", { className: "loading", children: "Loading..." });
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-base-content", children: "Posts" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "table w-full", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "text-base-content", children: "Author" }), _jsx("th", { className: "text-base-content", children: "Content" }), _jsx("th", { className: "text-base-content", children: "Likes" }), _jsx("th", { className: "text-base-content", children: "Comments" }), _jsx("th", { className: "text-base-content", children: "Actions" })] }) }), _jsx("tbody", { children: posts.map((post) => (_jsxs("tr", { children: [_jsx("td", { className: "text-base-content", children: post.author?.username }), _jsx("td", { className: "text-base-content", children: post.text?.substring(0, 80) }), _jsx("td", { className: "text-base-content", children: post.likes?.length }), _jsx("td", { className: "text-base-content", children: post.comments?.length }), _jsx("td", { children: _jsx("button", { onClick: () => deletePost(post._id), className: "btn btn-sm btn-outline btn-error", "aria-label": `Delete post ${post._id}`, title: "Delete post", children: _jsx(Trash2, { className: "w-4 h-4" }) }) })] }, post._id))) })] }) })] }));
}
