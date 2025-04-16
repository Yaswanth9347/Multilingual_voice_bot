// VoiceSettings.jsx
import React from "react";
import Select from "react-select";

const VoiceSettings = ({ voice = "auto", onChangeVoice }) => {
  const voiceOptions = [
    { value: "auto", label: "🌍 Auto Detect" },
    { value: "male", label: "👨 Male" },
    { value: "female", label: "👩 Female" },
    { value: "child", label: "👶 Child" },
  ];

  return (
    <div className="voice-settings">
      <label htmlFor="voice-select" className="settings-label">
        Select Voice:
      </label>
      <Select
        id="voice-select"
        options={voiceOptions}
        value={voiceOptions.find((option) => option.value === voice)}
        onChange={(selectedOption) => onChangeVoice(selectedOption.value)}
        isSearchable
        placeholder="Choose a voice..."
        aria-label="Voice selection dropdown"
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

export default VoiceSettings;
