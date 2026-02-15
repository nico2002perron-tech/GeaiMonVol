'use client';

interface GeaiAssistantProps {
    onOpen: () => void;
}

export default function GeaiAssistant({ onOpen }: GeaiAssistantProps) {
    return (
        <>
            <div className="geai-btn" id="geaiBtn" onClick={onOpen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div className="geai-bubble" id="geaiBubble"></div>
        </>
    );
}
