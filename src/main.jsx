import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppInitProvider } from "./context/AppInitProvider";
import { AppProvider } from "./context/AppContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppInitProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AppInitProvider>
    </BrowserRouter>
  </React.StrictMode>
);