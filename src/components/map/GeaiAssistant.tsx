'use client';
import { useState, useEffect } from 'react';

interface GeaiAssistantProps {
    onOpen: () => void;
}

const MESSAGES = [
    "Paris à -77%... ça t'intéresse? 👀",
    "Je peux te trouver un pack Vol + Hôtel pour Cancún 🏖️",
    "Ton budget est de combien? Je cherche pour toi!",
    "3 nouveaux deals détectés depuis Montréal ✈️",
    "Barcelone à -57%... on regarde ensemble?",
];

export default function GeaiAssistant({ onOpen }: GeaiAssistantProps) {
    const [showBubble, setShowBubble] = useState(false);
    const [message, setMessage] = useState('');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Show first bubble after 5 seconds
        const timer = setTimeout(() => {
            if (!dismissed) {
                setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
                setShowBubble(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [dismissed]);

    // Auto-hide bubble after 8 seconds
    useEffect(() => {
        if (!showBubble) return;
        const timer = setTimeout(() => setShowBubble(false), 8000);
        return () => clearTimeout(timer);
    }, [showBubble]);

    // Show a new bubble every 30 seconds
    useEffect(() => {
        if (dismissed) return;
        const interval = setInterval(() => {
            setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
            setShowBubble(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [dismissed]);

    return (
        <>
            {/* Chat bubble */}
            {showBubble && !dismissed && (
                <div
                    className="geai-bubble show"
                    onClick={() => {
                        setShowBubble(false);
                        setDismissed(true);
                        onOpen();
                    }}
                    style={{
                        position: 'fixed',
                        bottom: 80,
                        right: 24,
                        maxWidth: 240,
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: '16px 16px 4px 16px',
                        boxShadow: '0 8px 32px rgba(26, 43, 66, 0.15)',
                        border: '1px solid rgba(46, 125, 219, 0.15)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#1A2B42',
                        cursor: 'pointer',
                        zIndex: 1000,
                        animation: 'bubbleIn 0.4s cubic-bezier(.34, 1.56, .64, 1)',
                        lineHeight: 1.4,
                    }}
                >
                    {message}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowBubble(false);
                            setDismissed(true);
                        }}
                        style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            fontSize: 10,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8FA3B8',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Chat button */}
            <div
                className="geai-btn"
                onClick={onOpen}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2E7DDB, #1E5FA8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(46, 125, 219, 0.35)',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(.34, 1.56, .64, 1)',
                    pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(46, 125, 219, 0.45)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(46, 125, 219, 0.35)';
                }}
            >
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
        </>
    );
}
