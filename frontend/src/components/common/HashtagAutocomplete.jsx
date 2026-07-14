import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../lib/axios";
import { X } from "lucide-react";

const HashtagAutocomplete = ({ value, onChange, placeholder = "Add hashtags..." }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [currentInput, setCurrentInput] = useState("");
    const [hashtags, setHashtags] = useState([]);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (Array.isArray(value)) {
            setHashtags(value);
        } else if (typeof value === 'string' && value.trim()) {
            setHashtags(value.split(' ').filter(h => h.trim()));
        } else {
            setHashtags([]);
        }
    }, [value]);

    const fetchSuggestions = async (query) => {
        if (!query || query.length < 1) {
            setSuggestions([]);
            return;
        }

        try {
            const token = localStorage.getItem('access-token');
            const response = await axiosInstance.get(`/search/hashtag/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.suggestedHashtags) {
                const hashtagStrings = response.data.suggestedHashtags.map(h => h._id);
                setSuggestions(hashtagStrings);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching hashtag suggestions:", error);
            setSuggestions([]);
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setCurrentInput(newValue);
        
        // Fetch suggestions for any input
        if (newValue.trim()) {
            fetchSuggestions(newValue.trim());
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                e.stopPropagation();
                addHashtag(suggestions[selectedIndex]);
            } else if (e.key === 'Enter' && selectedIndex < 0 && currentInput.trim()) {
                e.preventDefault();
                e.stopPropagation();
                addHashtag(currentInput.trim());
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        } else if (e.key === 'Enter' && currentInput.trim()) {
            e.preventDefault();
            e.stopPropagation();
            addHashtag(currentInput.trim());
        } else if (e.key === ' ' && currentInput.trim()) {
            e.preventDefault();
            e.stopPropagation();
            addHashtag(currentInput.trim());
        } else if (e.key === 'Backspace' && !currentInput && hashtags.length > 0) {
            removeHashtag(hashtags.length - 1);
        }
    };

    const addHashtag = (hashtag) => {
        const cleanHashtag = hashtag.replace('#', '').trim();
        if (cleanHashtag && !hashtags.includes(cleanHashtag)) {
            const newHashtags = [...hashtags, cleanHashtag];
            setHashtags(newHashtags);
            onChange(newHashtags);
        }
        setCurrentInput("");
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    const removeHashtag = (index) => {
        const newHashtags = hashtags.filter((_, i) => i !== index);
        setHashtags(newHashtags);
        onChange(newHashtags);
    };

    const selectSuggestion = (hashtag) => {
        addHashtag(hashtag);
    };

    const handleSuggestionClick = (e, hashtag) => {
        e.preventDefault();
        e.stopPropagation();
        selectSuggestion(hashtag);
    };

    const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="border-2 border-base-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/20 transition-all duration-200">
                <div className="flex flex-wrap gap-2 mb-2">
                    {hashtags.map((hashtag, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-base-300 rounded-full text-sm text-base-content/80"
                        >
                            <span>#{hashtag}</span>
                            <button
                                type="button"
                                onClick={() => removeHashtag(index)}
                                className="hover:text-gray-900 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="relative">
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 text-base-content/60 font-semibold">#</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (currentInput.trim()) {
                                fetchSuggestions(currentInput.trim());
                            }
                        }}
                        placeholder={hashtags.length === 0 ? placeholder : ""}
                        className="w-full border-none focus:outline-none pl-6 text-sm"
                    />
                </div>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mb-1 bg-base-100 border-2 border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto bottom-full">
                    {suggestions.map((hashtag, index) => (
                        <div
                            key={index}
                            className={`p-3 cursor-pointer transition-colors duration-150 ${
                                index === selectedIndex 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'hover:bg-base-200 text-base-content/80'
                            }`}
                            onClick={(e) => handleSuggestionClick(e, hashtag)}
                        >
                            #{hashtag}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HashtagAutocomplete;
