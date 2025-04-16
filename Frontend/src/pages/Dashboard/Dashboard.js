// Dashboard.js
import React, { useEffect, useState } from "react";
import { API } from "../../api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await API.get("/session");
        if (response.data.loggedIn) {
          setUsername(response.data.username);
        } else {
          setUsername(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await API.post("/logout"); // Log out the user from the server
      setUsername(null);
      navigate("/login"); // Navigate to login page
      window.location.reload(); // Refresh the page to reset the session
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-green-500 text-white">
      <div className="dashboard-container rounded-lg p-6 bg-gray-800 shadow-lg w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-4">
          {username ? `Welcome, ${username}!` : "Dashboard"}
        </h2>
        <p>{username ? "You are logged in." : "You have been logged out."}</p>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-800 rounded-lg text-white transition duration-300 mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
