'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
    return (
        <html>
            <body>
                <button onClick={reset}>Réessayer</button>
            </body>
        </html>
    );
}
