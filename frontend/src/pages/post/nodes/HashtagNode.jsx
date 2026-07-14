import { TextNode } from "lexical";

export class HashtagNode extends TextNode {
    static getType() {
        return "hashtag";
    }

    static clone(node) {
        return new HashtagNode(node.__tag, node.__key);
    }

    constructor(tag, key) {
        super(`#${tag}`, key);
        this.__tag = tag;
    }

    createDOM(config) {
        const dom = super.createDOM(config);
        dom.className = config.theme.hashtag;
        dom.textContent = `#${this.__tag}`;
        return dom;
    }

    updateDOM(prevNode, dom, config) {
        const isUpdated = super.updateDOM(prevNode, dom, config);
        if (prevNode.__tag !== this.__tag) {
            dom.textContent = `#${this.__tag}`;
        }
        return isUpdated;
    }

    getTag() { return this.__tag; }

    exportJSON() {
        return {
            ...super.exportJSON(),
            type: "hashtag",
            tag: this.__tag,
        };
    }

    static importJSON(serializedNode) {
        const node = new HashtagNode(serializedNode.tag);
        TextNode.importJSON(serializedNode, node);
        return node;
    }
}

export function $createHashtagNode(tag) {
    return new HashtagNode(tag);
}