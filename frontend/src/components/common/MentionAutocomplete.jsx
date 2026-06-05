import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../lib/axios";

const MentionAutocomplete = ({ value, onChange, placeholder = "Mention someone..." }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            setInputValue(value);
        }
    }, [value]);

    const fetchSuggestions = async (query) => {
        if (!query || query.length < 1) {
            setSuggestions([]);
            return;
        }

        try {
            const token = localStorage.getItem('access-token');
            const response = await axiosInstance.get(`/search/user/${query}/10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data) {
                setSuggestions(response.data);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching user suggestions:", error);
            setSuggestions([]);
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // Fetch suggestions for any input (not just after @)
        if (newValue.trim()) {
            fetchSuggestions(newValue.trim());
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
        
        onChange(newValue);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const selectSuggestion = (user) => {
        const username = user.username || user;
        const newValue = username + ' ';
        setInputValue(newValue);
        onChange(newValue);
        setShowSuggestions(false);
        setSelectedIndex(-1);
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
            <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">@</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (inputValue.trim()) {
                            fetchSuggestions(inputValue.trim());
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-200 transition-all duration-200"
                />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mb-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto bottom-full">
                    {suggestions.map((user, index) => (
                        <div
                            key={user._id || index}
                            className={`p-3 cursor-pointer transition-colors duration-150 flex items-center gap-3 ${
                                index === selectedIndex 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => selectSuggestion(user)}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                {user.avatarUrl && (
                                    <img 
                                        src={user.avatarUrl} 
                                        alt={user.displayName || user.username}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold">{user.displayName || user.username}</span>
                                <span className="text-sm text-gray-500">@{user.username}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionAutocomplete;
