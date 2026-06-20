import {useRef, useState} from 'react';

const AudioContainer = ({ audioSrc }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const progressRef = useRef(null);

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e) => {
        const bar = progressRef.current;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.currentTime = percent * duration;
        setProgress(percent * 100);
    };

    return (
        <div className="w-full h-full object-cover object-center rounded-lg border border-gray-700">

            {/* Waveform background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-[url('/Snitch_Audio_Waveform(1920 x 1080).png')]"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0" />

            {/* Centered controls */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-4 w-full max-w-lg px-6">

                    {/* Play button */}
                    <button
                        onClick={togglePlay}
                        className="flex-shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    >
                        {isPlaying? (
                            <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 fill-black ml-1" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Progress bar + time */}
                    <div className="flex-1">
                        <div
                            ref={progressRef}
                            onClick={handleSeek}
                            className="w-full h-2 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                        >
                            <div
                                className="h-full bg-white rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-white text-xs mt-1 font-medium">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <audio
                ref={audioRef}
                onTimeUpdate={(e) => {
                    const a = e.currentTarget;
                    if (a.duration) setAudioProgress((a.currentTime / a.duration) * 100);
                }}
                onEnded={() => {
                    setIsPlayingAudio(null);
                    setAudioProgress(0);
                }}
                className="hidden"
            />
        </div>
    );
}

export default AudioContainer;