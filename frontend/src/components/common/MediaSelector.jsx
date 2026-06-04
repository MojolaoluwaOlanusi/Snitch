// New component: MediaSelector.jsx
import React, { useRef, useEffect } from 'react';

const MediaSelector = ({
  file,
  previewUrl,
  onSelect,
  onRemove,
  accept = 'image/*,video/*,audio/*',
  buttonLabel = 'Select Media'
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup object url if created outside
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    onSelect(f);
  };

  return (
    <div className="w-full">
      {!previewUrl ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => inputRef.current && inputRef.current.click()}
          >
            {buttonLabel}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        // fixed preview container so it doesn't stretch the layout
        <div className="relative rounded h-72 w-full overflow-hidden">
          {/* preview */}
          {file?.type?.startsWith('image') || (!file && previewUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
            <img src={previewUrl} alt="preview" className="h-full w-full object-contain" />
          ) : (file?.type?.startsWith('video') || previewUrl?.match(/\.(mp4|webm|ogg)$/i)) ? (
            <video src={previewUrl} controls className="h-full w-full object-contain" />
          ) : (
            <audio src={previewUrl} controls className="w-full" />
          )}

          <button
            type="button"
            aria-label="Remove media"
            className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
            onClick={onRemove}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaSelector;
