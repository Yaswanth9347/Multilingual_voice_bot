// Loader.jsx
import React from "react";
import ".styles.css";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="loader"></div>
      <p className="loader-text">{message}</p>
    </div>
  );
};

export default Loader;
