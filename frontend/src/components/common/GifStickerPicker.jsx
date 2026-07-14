import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "../../lib/axios";
import { Camera } from "lucide-react";
import { toast } from 'sonner'

const PAGE_SIZE = 20;

const GifStickerPicker = ({ onSelect, onClose, isOpen, onOpenStickerEditor }) => {
    const [tab, setTab] = useState('gif');
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [gifOffset, setGifOffset] = useState(0);
    const [gifTotal, setGifTotal] = useState(0);
    const [loadingGifs, setLoadingGifs] = useState(false);
    const [loadingMoreGifs, setLoadingMoreGifs] = useState(false);

    const [packs, setPacks] = useState([]);
    const [selectedPack, setSelectedPack] = useState(null);
    const [customStickers, setCustomStickers] = useState([]);
    const [customSkip, setCustomSkip] = useState(0);
    const [customTotal, setCustomTotal] = useState(0);
    const [loadingStickers, setLoadingStickers] = useState(false);
    const [loadingMoreStickers, setLoadingMoreStickers] = useState(false);

    const searchTimeoutRef = useRef(null);
    const pickerRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen, onClose]);

    // Reset pagination on tab change
    useEffect(() => {
        setGifOffset(0);
        setCustomSkip(0);
        setSearchQuery('');
        if (tab === 'gif') fetchTrendingGifs(0);
        else fetchStickerPacks();
    }, [tab, isOpen]);

    const fetchTrendingGifs = async (offset = 0, append = false) => {
        if (offset === 0) setLoadingGifs(true);
        else setLoadingMoreGifs(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/giphy/trending', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: PAGE_SIZE, offset }
            });
            if (append) {
                setGifs(prev => [...prev, ...(res.data.gifs || [])]);
            } else {
                setGifs(res.data.gifs || []);
            }
            setGifTotal(res.data.total || 0);
            setGifOffset(offset + PAGE_SIZE);
        } catch { toast.error('Failed to load GIFs'); }
        finally {
            setLoadingGifs(false);
            setLoadingMoreGifs(false);
        }
    };

    const searchGifs = async (query, offset = 0, append = false) => {
        if (!query.trim()) {
            fetchTrendingGifs(0);
            return;
        }
        if (offset === 0) setLoadingGifs(true);
        else setLoadingMoreGifs(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/giphy/search', {
                headers: { Authorization: `Bearer ${token}` },
                params: { q: query, limit: PAGE_SIZE, offset }
            });
            if (append) {
                setGifs(prev => [...prev, ...(res.data.gifs || [])]);
            } else {
                setGifs(res.data.gifs || []);
            }
            setGifTotal(res.data.total || 0);
            setGifOffset(offset + PAGE_SIZE);
        } catch { toast.error('Failed to search GIFs'); }
        finally {
            setLoadingGifs(false);
            setLoadingMoreGifs(false);
        }
    };

    const fetchStickerPacks = async () => {
        setLoadingStickers(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/stickers', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: PAGE_SIZE, skip: 0 }
            });
            setPacks(res.data.packs || []);
            if (res.data.customPack) {
                setCustomStickers(res.data.customPack.stickers || []);
                setCustomTotal(res.data.customPagination?.total || 0);
                setCustomSkip(PAGE_SIZE);
            }
        } catch { toast.error('Failed to load stickers'); }
        finally { setLoadingStickers(false); }
    };

    const loadMoreCustomStickers = async () => {
        setLoadingMoreStickers(true);
        try {
            const token = localStorage.getItem('access-token');
            const res = await axiosInstance.get('/chat/stickers', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: PAGE_SIZE, skip: customSkip }
            });
            if (res.data.customPack) {
                setCustomStickers(prev => [...prev, ...(res.data.customPack.stickers || [])]);
                setCustomTotal(res.data.customPagination?.total || 0);
                setCustomSkip(prev => prev + PAGE_SIZE);
            }
        } catch { toast.error('Failed to load more stickers'); }
        finally { setLoadingMoreStickers(false); }
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            if (tab === 'gif') searchGifs(value, 0);
        }, 500);
    };

    const hasMoreGifs = gifOffset < gifTotal;
    const hasMoreCustom = customSkip < customTotal;

    if (!isOpen) return null;

    return (
        <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:absolute md:bottom-12 md:left-0 md:inset-x-auto"
        >
            {/* White card wrapper */}
            <div className="bg-base-100 rounded-xl shadow-xl border w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:w-[380px] overflow-hidden flex flex-col"
                 style={{
                     maxHeight: '70vh',
                     marginBottom: '8px',
                 }}
            >
                <div className="flex items-center border-b">
                    <button onClick={() => { setTab('gif'); setSelectedPack(null); }} className={`flex-1 py-3 text-sm font-medium ${tab === 'gif' ? 'text-primary border-b-2 border-blue-400' : 'text-base-content/60'}`}>GIF</button>
                    <button onClick={() => { setTab('sticker'); setSelectedPack(null); }} className={`flex-1 py-3 text-sm font-medium ${tab === 'sticker' ? 'text-primary border-b-2 border-blue-400' : 'text-base-content/60'}`}>Stickers</button>
                    <button onClick={onClose} className="p-2 hover:bg-base-200 rounded-full m-1"><X className="w-4 h-4 text-base-content/50" /></button>
                </div>

                {tab === 'gif' && (
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                            <input type="text" placeholder="Search GIFs..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-base-200 rounded-lg text-sm focus:outline-none" />
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2">
                    {/* GIF Grid */}
                    {tab === 'gif' && (
                        <>
                            {loadingGifs && <div className="text-center py-4 text-base-content/50 text-sm">Loading...</div>}
                            {!loadingGifs && gifs.length === 0 && (
                                <div className="text-center py-4 text-base-content/50 text-sm">No GIFs found</div>
                            )}
                            {gifs.length > 0 && (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                        {gifs.map(gif => (
                                            <div key={gif.id} onClick={() => { onSelect({ type: 'gif', url: gif.url, preview: gif.preview }); onClose(); }} className="cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-primary">
                                                <img src={gif.preview} alt="" className="w-full h-20 object-cover" loading="lazy" />
                                            </div>
                                        ))}
                                    </div>
                                    {hasMoreGifs && (
                                        <button
                                            onClick={() => {
                                                if (searchQuery.trim()) searchGifs(searchQuery, gifOffset, true);
                                                else fetchTrendingGifs(gifOffset, true);
                                            }}
                                            disabled={loadingMoreGifs}
                                            className="w-full mt-2 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            {loadingMoreGifs ? 'Loading...' : 'Show More'}
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Sticker tab */}
                    {tab === 'sticker' && (
                        loadingStickers ? (
                            <div className="text-center py-4 text-base-content/50 text-sm">Loading...</div>
                        ) : selectedPack ? (
                            <div>
                                <button onClick={() => setSelectedPack(null)} className="text-sm text-primary hover:text-primary mb-2">← Back</button>
                                <div className="grid grid-cols-4 gap-2">
                                    {selectedPack.stickers.map(sticker => (
                                        <div key={sticker.id} onClick={() => { onSelect({ type: 'sticker', url: sticker.url }); onClose(); }} className="cursor-pointer hover:scale-110 transition-transform">
                                            <img src={sticker.url} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto" onError={(e) => { e.target.src = '/sticker-placeholder.png'; }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Default packs */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {packs.map(pack => (
                                        <div key={pack.id} onClick={() => setSelectedPack(pack)} className="cursor-pointer rounded-xl hover:bg-base-200 p-3 text-center transition-all">
                                            <img src={pack.thumbnail} alt={pack.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto mb-2" onError={(e) => { e.target.src = '/sticker-placeholder.png'; }} />
                                            <p className="text-xs font-medium text-base-content/80">{pack.name}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Custom Community Stickers */}
                                {customStickers.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-base-content/60 mb-2 px-1">Community Stickers</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {customStickers.map(sticker => (
                                                <div key={sticker.id} onClick={() => { onSelect({ type: 'sticker', url: sticker.url }); onClose(); }} className="cursor-pointer hover:scale-110 transition-transform">
                                                    <img src={sticker.url} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto" onError={(e) => { e.target.src = '/sticker-placeholder.png'; }} />
                                                </div>
                                            ))}
                                        </div>
                                        {hasMoreCustom && (
                                            <button
                                                onClick={loadMoreCustomStickers}
                                                disabled={loadingMoreStickers}
                                                className="w-full mt-2 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                {loadingMoreStickers ? 'Loading...' : 'Show More'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Create Sticker button */}
                <button
                    onClick={() => { onClose(); onOpenStickerEditor(); }}
                    className="w-full py-2 border-t border-base-300 text-sm text-base-content/70 hover:bg-base-200 flex items-center justify-center gap-2"
                >
                    <Camera className="w-4 h-4" /> Create Sticker
                </button>
            </div>
        </motion.div>
    );
};

export default GifStickerPicker;