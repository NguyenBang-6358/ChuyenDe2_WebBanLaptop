export type ThemeColor = "red" | "blue" | "green" | "black";

export interface AppSettings {
  storeName: string;
  hotline: string;
  defaultShippingFee: number;
  freeShippingLimit: number;
  requireOtp: boolean;
  notifyEmail: boolean;
  themeColor: ThemeColor;
}

const SETTINGS_KEY = "laptop_center_settings";

export const defaultSettings: AppSettings = {
  storeName: "Laptop Center",
  hotline: "1900 6868",
  defaultShippingFee: 30000,
  freeShippingLimit: 15000000,
  requireOtp: true,
  notifyEmail: true,
  themeColor: "red",
};

export function applyThemeColor(theme: ThemeColor) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-red", "theme-blue", "theme-green", "theme-black");
  root.classList.add(`theme-${theme}`);
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      applyThemeColor(defaultSettings.themeColor);
      return defaultSettings;
    }
    const parsed = JSON.parse(data);
    if (parsed.storeName === "Laptop Center Việt Nam") {
      parsed.storeName = "Laptop Center";
    }
    const settings = { ...defaultSettings, ...parsed };
    applyThemeColor(settings.themeColor);
    return settings;
  } catch {
    applyThemeColor(defaultSettings.themeColor);
    return defaultSettings;
  }
}

export function saveAppSettings(newSettings: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...newSettings };
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    applyThemeColor(updated.themeColor);
    window.dispatchEvent(new Event("app_settings_updated"));
  }
  return updated;
}

// Automatically apply theme color on script load
if (typeof window !== "undefined") {
  getAppSettings();
}
