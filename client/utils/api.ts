import type { PriceData, SettingsData } from "../../types";

export const getPrices = async () => {
  const response = await fetch("/api/prices");

  if (!response.ok) {
    throw new Error("Failed to fetch prices");
  }

  return response.json() as Promise<PriceData>;
};

export const getSettings = async () => {
  const response = await fetch("/api/settings");

  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }

  return response.json() as Promise<SettingsData>;
};
