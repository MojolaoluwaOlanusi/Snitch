/**
 * Generates a dynamic SVG avatar for a group (like a circle with the group's first letter).
 * Used as a fallback when the group has no uploaded avatar.
 *
 * @param groupName - The name of the group (e.g., "My Group") -> "M"
 * @param color - A hex color for the background (default: #6366f1 = indigo)
 * @returns A data:image/svg+xml;base64 URL
 */
export const generateGroupAvatar = (
    groupName: string,
    color: string = '#6366f1'
): string => {
    const letter = groupName?.charAt(0).toUpperCase() || 'G';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" rx="50" fill="${color}" />
            <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">${letter}</text>
        </svg>
    `;

    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
};