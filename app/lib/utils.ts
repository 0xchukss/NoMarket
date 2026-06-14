import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortKey(value: string, left = 4, right = 4) {
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function formatSol(lamports: number | bigint) {
  const value = typeof lamports === "bigint" ? Number(lamports) : lamports;
  return `${(value / 1_000_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 4
  })} SOL`;
}
