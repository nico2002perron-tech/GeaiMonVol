import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "CAD") {
    return new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency,
    }).format(price);
}
