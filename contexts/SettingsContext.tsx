// SettingsContext.tsx
import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

export type ThemeMode = "light" | "dark";
export type AppLanguage = "tr" | "en" | "de";

type SettingsContextValue = {
  theme: ThemeMode;
  language: AppLanguage;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lang: AppLanguage) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [language, setLanguageState] = useState<AppLanguage>("tr");

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    // TODO: İstersen AsyncStorage ile kalıcı hale getirebilirsin
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    // TODO: Burada da dil ayarını persist edebilirsin
  };

  const value: SettingsContextValue = {
    theme,
    language,
    setTheme,
    toggleTheme,
    setLanguage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
};
