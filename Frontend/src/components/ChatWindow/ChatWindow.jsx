import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSettings } from "../../context/SettingsContext";

const ChatWindow = ({ messages }) => {
  const messagesEndRef = useRef(null);
  const [mutedMessages, setMutedMessages] = useState({});

  const { language, voice } = useSettings();

  const languageMapping = useMemo(
    () => ({
      auto: "en-US",
      en: "en-US",
      te: "te-IN",
      hi: "hi-IN",
      or: "or-IN",
      ko: "ko-KR",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      zh: "zh-CN",
    }),
    []
  );

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to speak a given text
  const speak = useCallback(
    (text) => {
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageMapping[language] || "en-US";
      utterance.rate = 1;
      if (voice !== "Default") {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(
          (v) => v.name.toLowerCase() === voice.toLowerCase()
        );
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    },
    [language, voice, languageMapping]
  );

  // The toggle button now only triggers speech synthesis manually.
  const toggleMute = (index, text) => {
    setMutedMessages((prev) => {
      const isMuted = prev[index];
      if (!isMuted) {
        // When unmuting, speak the message once manually.
        speak(text);
      } else {
        window.speechSynthesis.cancel();
      }
      return { ...prev, [index]: !isMuted };
    });
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleThumbsUp = (index) => {
    alert(`Thumbs up for message ${index}`);
  };

  const handleThumbsDown = (index) => {
    alert(`Thumbs down for message ${index}`);
  };

  return (
    <div className="chat-messages">
      {messages.map((msg, index) => (
        <div key={index} className="message-item mb-3">
          <div
            className={`message-container flex flex-col ${
              msg.sender === "User"
                ? "user-message items-end"
                : "bot-message items-start"
            }`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "User" ? "bg-blue-100" : "bg-gray-100"
              } p-3 rounded-lg max-w-lg shadow-md`}
            >
              <div className="flex items-start">
                <span className="chat-icon mr-2 text-gray-600">
                  {msg.sender === "User" ? "👤" : "🤖"}
                </span>
                <div className="chat-text text-gray-800">{msg.text}</div>
              </div>
              {msg.sender === "Bot" && (
                <div className="flex items-center space-x-4 mt-3 text-gray-600">
                  <button
                    onClick={() => handleCopy(msg.text)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-transform duration-200 transform hover:scale-105"
                  >
                    <span role="img" aria-label="copy">
                      📋
                    </span>
                  </button>
                  <button
                    onClick={() => toggleMute(index, msg.text)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-transform duration-200 transform hover:scale-105"
                  >
                    {mutedMessages[index] ? (
                      <span role="img" aria-label="unmute">
                        🔊
                      </span>
                    ) : (
                      <span role="img" aria-label="mute">
                        🔇
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleThumbsUp(index)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-transform duration-200 transform hover:scale-105"
                  >
                    <span role="img" aria-label="thumbs up">
                      👍
                    </span>
                  </button>
                  <button
                    onClick={() => handleThumbsDown(index)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-transform duration-200 transform hover:scale-105"
                  >
                    <span role="img" aria-label="thumbs down">
                      👎
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
