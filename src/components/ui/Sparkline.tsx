'use client';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
}

export default function Sparkline({ data, width = 232, height = 28 }: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    const points = data.map((v, i) => {
        const x = padding + (i / (data.length - 1)) * innerW;
        const y = padding + innerH - ((v - min) / range) * innerH;
        return `${x},${y}`;
    });

    const polyline = points.join(' ');

    // Fill area under the line
    const firstX = padding;
    const lastX = padding + innerW;
    const fillPath = `${polyline} ${lastX},${height} ${firstX},${height}`;

    // Green if price is trending down (last < first), red otherwise
    const trending = data[data.length - 1] <= data[0];
    const stroke = trending ? '#16a34a' : '#dc2626';
    const fill = trending ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)';

    // Last point coordinates
    const lastPoint = points[points.length - 1].split(',');

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block' }}
        >
            <polygon points={fillPath} fill={fill} />
            <polyline
                points={polyline}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx={lastPoint[0]}
                cy={lastPoint[1]}
                r={2.5}
                fill={stroke}
            />
        </svg>
    );
}
