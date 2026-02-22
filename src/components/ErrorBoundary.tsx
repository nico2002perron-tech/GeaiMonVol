'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontFamily: "'Outfit', sans-serif",
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <h2>Oups, quelque chose s'est mal passé</h2>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            padding: '10px 20px',
                            background: '#2E7DDB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        Réessayer
                    </button>
                    <div style={{ fontSize: '10px', color: '#8FA3B8' }}>
                        Détails dans la console (F12)
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
