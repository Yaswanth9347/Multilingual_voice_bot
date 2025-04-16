// InputArea.jsx
import React, { useState, useEffect } from "react";
import { FaMicrophone, FaPaperPlane } from "react-icons/fa";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./InputArea.css"; // Ensure this file is imported

const InputArea = ({ onSendMessage, isMachineSpeaking }) => {
  const [input, setInput] = useState("");
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const isSpeechSupported = SpeechRecognition.browserSupportsSpeechRecognition();

  // Update input when listening stops
  useEffect(() => {
    if (!listening && transcript) {
      setInput(transcript);
    }
  }, [listening, transcript, resetTranscript]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
      resetTranscript();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim()) {
      handleSend();
    }
  };

  const toggleListening = () => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  return (
    <div className="input-area">
      {listening && (
        <div className="sound-wave-animation" aria-hidden="true"></div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      <button
        onClick={toggleListening}
        className={`microphone-button ${listening ? "active" : ""}`}
        aria-label="Toggle speech recognition"
      >
        <FaMicrophone />
      </button>
      <button
        onClick={handleSend}
        className="send-button"
        aria-label="Send message"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default InputArea;
