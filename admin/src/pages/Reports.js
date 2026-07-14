import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/admin/reports')
            .then(({ data }) => setReports(data))
            .catch(() => toast.error('Failed to load reports'))
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return _jsx("div", { className: "loading", children: "Loading..." });
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-6 text-base-content", children: "Reports" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "table w-full", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "text-base-content", children: "Post" }), _jsx("th", { className: "text-base-content", children: "Reported by" }), _jsx("th", { className: "text-base-content", children: "Reason" }), _jsx("th", { className: "text-base-content", children: "Date" })] }) }), _jsx("tbody", { children: reports.map((report) => (_jsxs("tr", { children: [_jsx("td", { className: "text-base-content", children: report.postId?.text?.substring(0, 50) || 'N/A' }), _jsx("td", { className: "text-base-content", children: report.reportedBy?.username }), _jsx("td", { className: "text-base-content", children: report.reason?.reason || report.reason }), _jsx("td", { className: "text-base-content", children: new Date(report.createdAt).toLocaleDateString() })] }, report._id))) })] }) })] }));
}
