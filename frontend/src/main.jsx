import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./index.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Clerk Provider maintains the authentication layer */}
      <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/">
        <AppProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderRadius: "12px", // Matches Card radius
                padding: "16px",
                fontSize: "14px",
                fontWeight: "700", // Rule: Bold for readability
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(25, 118, 210, 0.12)", // Rule 3 Shadow
              },
              success: {
                iconTheme: {
                  primary: "#4CAF50", // Rule: var(--success)
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#E53935", // Rule: var(--danger)
                  secondary: "#fff",
                },
              },
              // Info/Loading toasts use Primary Blue
              loading: {
                iconTheme: {
                  primary: "#1976D2", // Rule: var(--primary)
                  secondary: "#fff",
                },
              },
            }}
          />
          <App />
        </AppProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
);