import { TextNode } from "lexical";

export class MentionNode extends TextNode {
    static getType() {
        return "mention";
    }

    static clone(node) {
        return new MentionNode(node.__displayName, node.__username, node.__avatar, node.__key);
    }

    constructor(displayName, username, avatar, key) {
        super(`@${displayName}`, key);
        this.__displayName = displayName;
        this.__username = username;
        this.__avatar = avatar;
    }

    createDOM(config) {
        const dom = super.createDOM(config);
        dom.className = config.theme.mention;
        dom.textContent = `@${this.__displayName}`;
        return dom;
    }

    updateDOM(prevNode, dom, config) {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        if (prevNode.__displayName !== this.__displayName) {
            dom.textContent = `@${this.__displayName}`;
        }
        return isUpdated;
    }

    getDisplayName() { return this.__displayName; }
    getUsername() { return this.__username; }

    exportJSON() {
        return {
            ...super.exportJSON(),
            type: "mention",
            displayName: this.__displayName,
            username: this.__username,
            avatar: this.__avatar,
        };
    }

    static importJSON(serializedNode) {
        const node = new MentionNode(
            serializedNode.displayName,
            serializedNode.username,
            serializedNode.avatar
        );
        TextNode.importJSON(serializedNode, node);
        return node;
    }
}

export function $createMentionNode(displayName, username, avatar) {
    return new MentionNode(displayName, username, avatar);
}