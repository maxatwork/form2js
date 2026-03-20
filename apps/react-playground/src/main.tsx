import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const appElement = document.getElementById("app");

if (!(appElement instanceof HTMLDivElement)) {
  throw new Error('Missing "#app" root element');
}

createRoot(appElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
