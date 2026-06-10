import EmojiPicker from "./EmojiPicker.jsx";
import React, { useState, useRef } from "react";

const SearchInput: React.FC = () => {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLTextAreaElement >(null);

    return (
        <div className="flex flex-col gap-2 w-full relative">
      <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message..."
          className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
      />
            <div className="flex items-center gap-2">
                <EmojiPicker inputRef={inputRef} value={value} setValue={setValue} />
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    onClick={() => console.log(value)}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default SearchInput;