// WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomePage.css";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-heading">Welcome to the Multilingual Voice Bot</h1>
        <p className="welcome-text">
          A powerful AI chatbot that speaks your language effortlessly.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="welcome-button"
          aria-label="Get Started"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
