export interface MapPinData {
    id: string;
    coords: [number, number];
    label: string;
}

export interface MapRegion {
    id: string;
    name: string;
    path: string; // SVG path data
}

export interface MapTransform {
    x: number;
    y: number;
    k: number;
}
