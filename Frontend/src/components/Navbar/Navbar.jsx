// navbar.jsx
import React from "react";

const Navbar = ({ onLogout, children }) => {
  const handleLogoutClick = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout();
    }
  };

  return (
    <nav className="navbar">
      <span className="navbar-title">Multilingual Voice Bot</span>
      <div className="navbar-actions">
        {children}
        <button onClick={handleLogoutClick} className="logout-button" aria-label="Logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
