import React, { Suspense, lazy } from "react";
import { useAppTheme } from '@/hooks/useAppTheme.js';

const LazyPicker = lazy(async () => {
    const mod = await import("@emoji-mart/react");
    return { default: mod.default };
});
import data from "@emoji-mart/data";

const EmojiPicker = ({ inputRef, value, setValue }) => {
    const appTheme = useAppTheme();

    const handleSelect = (emoji) => {
        if (inputRef && inputRef.current) {
            const el = inputRef.current;
            const start = el.selectionStart || 0;
            const end = el.selectionEnd || 0;

            const newValue = value.slice(0, start) + emoji.native + value.slice(end);
            setValue(newValue);

            setTimeout(() => {
                el.focus();
                const newPos = start + emoji.native.length;
                el.setSelectionRange(newPos, newPos);
            }, 50);

        }
    };

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8 text-base-content/50 text-sm">
                Loading emojis...
            </div>
        }>
            <LazyPicker
                data={data}
                onEmojiSelect={handleSelect}
                perLine={7}
                emojiSize={24}
                theme={appTheme}
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
            />
        </Suspense>
    );
};

export default EmojiPicker;