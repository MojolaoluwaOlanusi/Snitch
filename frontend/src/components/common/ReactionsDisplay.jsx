import { useState } from "react";

const ReactionsDisplay = ({ reactions }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (!reactions || reactions.length === 0) {
        return null;
    }

    // Count reactions by emoji
    const reactionCounts = reactions.reduce((acc, reaction) => {
        const emoji = reaction.reaction || reaction;
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
    }, {});

    // Sort by count and get top reactions
    const sortedReactions = Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([emoji, count]) => ({ emoji, count }));

    const displayReactions = isExpanded ? sortedReactions.slice(0, 10) : sortedReactions.slice(0, 3);

    return (
        <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 rounded-lg p-1 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {displayReactions.map(({ emoji, count }) => (
                <div 
                    key={emoji} 
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-sm hover:bg-gray-200 transition-colors"
                >
                    <span>{emoji}</span>
                    <span className="text-gray-600">{count}</span>
                </div>
            ))}
            {sortedReactions.length > 3 && !isExpanded && (
                <span className="text-gray-500 text-sm">+{sortedReactions.length - 3}</span>
            )}
        </div>
    );
};

export default ReactionsDisplay;
