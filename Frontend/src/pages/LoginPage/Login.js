// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../api";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Check if user is already logged in
  const checkSession = async () => {
    try {
      const response = await API.get("/session", { withCredentials: true });
      if (response.data.loggedIn) {
        navigate("/chat", { replace: true });
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  useEffect(() => {
    checkSession();
  }, [navigate]);

  // Handle input changes for username/password
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Traditional (username/password) login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/login", formData, {
        withCredentials: true,
      });
      if (data.success) {
        // Slight delay to allow session cookies to update, then verify session
        setTimeout(() => {
          checkSession();
        }, 100);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  // Google login: After successful authentication, verify session then navigate
  const handleGoogleSuccess = async (credentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const result = await API.post(
          "/auth/google",
          { token: credentialResponse.credential },
          { withCredentials: true }
        );
        if (result.data.success) {
          // Slight delay to ensure session cookies are set
          setTimeout(() => {
            checkSession();
          }, 100);
        } else {
          setMessage(result.data.message || "Google login failed.");
        }
      } catch (error) {
        console.error("Google login error:", error);
        setMessage("An error occurred during Google login. Please try again.");
      }
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
    setMessage("Google login failed. Please try again.");
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-green-500 text-white">
      <div className="login-box bg-white bg-opacity-10 rounded-2xl shadow-lg backdrop-blur-md p-8 text-center">
        <h2 className="login-title text-3xl font-bold text-white mb-4">Login</h2>
        {message && <p className="text-red-400 mb-4">{message}</p>}

        {/* Traditional username/password form */}
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
            className="login-btn w-full p-3 mt-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 shadow-lg transition-all"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-sm">
          <span>Don't have an account?</span>
          <a href="/register" className="text-orange-400 ml-2 font-bold">
            Register
          </a>
        </div>

        {/* Google Login button */}
        <div className="mt-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
