import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ITCertStudyHub from "./App.jsx";
import AuthGate from "./AuthGate.jsx";
import AuthCallback from "./pages/AuthCallback.jsx"; // this is your new page
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AuthGate>
              <ITCertStudyHub />
            </AuthGate>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
