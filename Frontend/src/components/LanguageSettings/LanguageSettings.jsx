// LanguageSettings.jsx
import React from "react";
import Select from "react-select";
import { useSettings } from "../../context/SettingsContext";

const LanguageSettings = () => {
  const { language, setLanguage } = useSettings();

  const languageOptions = [
    { value: "auto", label: "🌍 Auto-detect" },
    { value: "en", label: "🇬🇧 English" },
    { value: "te", label: "🇮🇳 Telugu" },
    { value: "hi", label: "🇮🇳 Hindi" },
    { value: "or", label: "🇮🇳 Odia" },
    { value: "ko", label: "🇰🇷 Korean" },
    { value: "es", label: "🇪🇸 Spanish" },
    { value: "fr", label: "🇫🇷 French" },
    { value: "de", label: "🇩🇪 German" },
    { value: "zh", label: "🇨🇳 Chinese" },
  ];

  return (
    <div className="language-settings">
      <label htmlFor="language-select" className="settings-label">
        Select Language:
      </label>
      <Select
        id="language-select"
        options={languageOptions}
        value={languageOptions.find((option) => option.value === language)}
        onChange={(selectedOption) => setLanguage(selectedOption.value)}
        aria-label="Language selection"
        placeholder="Choose a language..."
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: "8px",
            borderColor: "#aaa",
            boxShadow: "none",
            "&:hover": { borderColor: "#555" },
          }),
        }}
      />
    </div>
  );
};

export default LanguageSettings;
