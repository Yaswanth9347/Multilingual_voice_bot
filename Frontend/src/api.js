// api.js
import axios from "axios";

// Use environment variables for flexible configuration
const FLASK_API_URL = process.env.REACT_APP_FLASK_API_URL || "http://127.0.0.1:5000/api";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

// Function to send a chat message to the Flask backend
export const sendMessageToBot = async (message) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/chat`, { message });
    return response.data.response;
  } catch (error) {
    console.error("Error sending message:", error);
    return "Error: Could not reach the server.";
  }
};

// Axios instance for session-based auth calls (to your Node backend)
export const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ----- New Function: Google OAuth Login -----
// This function sends the Google ID token to the backend for verification and login.
export const googleOAuthLogin = async (token) => {
  try {
    const response = await API.post("/auth/google", { token });
    return response.data;
  } catch (error) {
    console.error("Google OAuth error:", error.response ? error.response.data : error);
    return { success: false, message: "Google OAuth login failed" };
  }
};
