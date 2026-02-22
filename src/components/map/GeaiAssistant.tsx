'use client';

interface GeaiAssistantProps {
    onOpen: () => void;
}

export default function GeaiAssistant({ onOpen }: GeaiAssistantProps) {
    return (
        <button
            onClick={onOpen}
            aria-label="Assistant voyage"
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'white',
                border: '1px solid rgba(46,125,219,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(26,43,66,0.1)',
                zIndex: 150,
                transition: 'all 0.3s cubic-bezier(.34, 1.56, .64, 1)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(46,125,219,0.2)';
                e.currentTarget.style.borderColor = 'rgba(46,125,219,0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,43,66,0.1)';
                e.currentTarget.style.borderColor = 'rgba(46,125,219,0.12)';
            }}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7DDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
}
