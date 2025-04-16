// Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Now using formData - you could replace this with an actual API call
    console.log("Registering with data:", formData);
    try {
      setMessage("Registration Successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register-container min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-green-500 text-white">
      <div className="register-box w-96 bg-white bg-opacity-10 rounded-2xl shadow-lg backdrop-blur-md p-8 text-center">
        <h2 className="register-title text-3xl font-bold text-white mb-4">Register</h2>
        {message && <p className="text-green-400 mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            className="input-field w-full p-3 bg-gray-800 text-white rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="input-field w-full p-3 bg-gray-800 text-white rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="register-btn w-full p-3 mt-4 bg-gradient-to-r from-green-400 to-teal-400 text-white font-bold rounded-lg hover:from-teal-400 hover:to-green-400 shadow-lg transition-all"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-4 text-sm">
          <span>Already have an account?</span>
          <button
            onClick={() => navigate("/login")}
            className="text-orange-400 ml-2 font-bold"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
