// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import Login from "./pages/LoginPage/Login";
import Register from "./pages/Register/Register";
import ChatPage from "./pages/ChatPage/ChatPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import { SettingsProvider } from "./context/SettingsContext";
import { API } from "./api";
import "./App.css";

const AppRoutes = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await API.get("/session");
        setIsLoggedIn(response.data.loggedIn);
      } catch (error) {
        console.error("Session check error:", error);
        setIsLoggedIn(false);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  if (checkingSession) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to="/chat" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={isLoggedIn ? <ChatPage /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <SettingsProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SettingsProvider>
  );
}

export default App;
