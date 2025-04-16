// ChatPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import InputArea from "../../components/InputArea/InputArea";
import LanguageSettings from "../../components/LanguageSettings/LanguageSettings";
import VoiceSettings from "../../components/VoiceSettings/VoiceSettings";
import { useSettings } from "../../context/SettingsContext";
import { sendMessageToBot, API } from "../../api";
import { FaSun, FaMoon } from "react-icons/fa";
import "./ChatPage.css";

const ChatPage = () => {
  const navigate = useNavigate();
  const { language, voice, setVoice } = useSettings();
  const [messages, setMessages] = useState([]);
  const [isMachineSpeaking, setIsMachineSpeaking] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [loading, setLoading] = useState(true);

  // Verify session on mount; if not logged in, redirect to Login
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await API.get("/session", { withCredentials: true });
        if (response.data.loggedIn) {
          setLoading(false);
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Session check failed:", error);
        navigate("/login", { replace: true });
      }
    };

    checkSession();
  }, [navigate]);

  // Dark mode handling
  useEffect(() => {
    const rootEl = document.documentElement;
    if (darkMode) {
      rootEl.classList.add("dark-mode");
      rootEl.classList.remove("light-mode");
    } else {
      rootEl.classList.add("light-mode");
      rootEl.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleSendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const userMessage = { sender: "User", text: trimmedText };
    setMessages((prev) => [...prev, userMessage]);
    setIsMachineSpeaking(true);
    try {
      const botReply = await sendMessageToBot(trimmedText);
      const botMessage = { sender: "Bot", text: botReply };
      setMessages((prev) => [...prev, botMessage]);

      // Speech synthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(botReply);
        const languageMapping = {
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
        };
        utterance.lang = languageMapping[language] || "en-US";
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
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsMachineSpeaking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/logout", {}, { withCredentials: true });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="chat-page-loading flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`chat-page ${darkMode ? "dark" : "light"}`}>
      <Navbar onLogout={handleLogout}>
        <button
          className="dark-mode-toggle"
          onClick={() => setDarkMode((prev) => !prev)}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </Navbar>
      <div className="chat-content">
        <div className="settings-bar">
          <LanguageSettings />
          <VoiceSettings voice={voice} onChangeVoice={setVoice} />
        </div>
        <div className="chat-window">
          <ChatWindow messages={messages} />
        </div>
        <div className="input-area-container">
          <InputArea
            onSendMessage={handleSendMessage}
            isMachineSpeaking={isMachineSpeaking}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
