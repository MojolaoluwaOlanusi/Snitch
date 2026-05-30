export const buildRegex = (query: string) => {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, "i");
};
