// index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log("Client ID:", clientId);

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
