import { useRef } from 'react';

// Helper to generate a stable unique ID per component instance
function useStableId() {
    const ref = useRef(null);
    if (!ref.current) {
        ref.current = 'id-' + Math.random().toString(36).slice(2, 11);
    }
    return ref.current;
}

export function SnitchLogo({ className = "w-32 h-32" }) {
    const uid = useStableId();
    return (
        <div className={`${className} relative flex items-center justify-center`}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                    <linearGradient id={`hexGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="50%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <filter id={`shadow-${uid}`}>
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
                    </filter>
                    <linearGradient id={`textGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#e0f2fe" />
                        <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                </defs>

                <path
                    d="M100 20 L170 60 L170 140 L100 180 L30 140 L30 60 Z"
                    fill={`url(#hexGradient-${uid})`}
                    filter={`url(#shadow-${uid})`}
                    className="transition-all duration-300"
                />
                <path
                    d="M100 30 L160 65 L160 135 L100 170 L40 135 L40 65 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                />
                <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="text-4xl"
                    style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                    }}
                >
                    <tspan fill="#0f172a" dy="0" dx="2">SNITCH</tspan>
                </text>
                <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="text-4xl"
                    style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                    }}
                >
                    <tspan fill="#1e3a8a" dy="0" dx="1">SNITCH</tspan>
                </text>
                <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="text-4xl"
                    style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                    }}
                >
                    <tspan fill={`url(#textGradient-${uid})`}>SNITCH</tspan>
                </text>
            </svg>
        </div>
    );
}

export function SnitchLogoSmall({ className = "w-10 h-10" }) {
    const uid = useStableId();
    return (
        <div className={`${className} relative flex items-center justify-center`}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                    <linearGradient id={`hexGradientSmall-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="50%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                </defs>
                <path
                    d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                    fill={`url(#hexGradientSmall-${uid})`}
                />
                <text
                    x="50"
                    y="65"
                    textAnchor="middle"
                    fill="white"
                    className="text-5xl"
                    style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 900,
                    }}
                >
                    S
                </text>
            </svg>
        </div>
    );
}