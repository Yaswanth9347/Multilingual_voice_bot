// SettingsContext.js
import { createContext, useContext, useState, useMemo } from "react";

const SettingsContext = createContext({
  language: "auto",
  setLanguage: () => {},
  voice: "Default",
  setVoice: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState("auto");
  const [voice, setVoice] = useState("Default");

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ language, setLanguage, voice, setVoice }), [language, voice]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
