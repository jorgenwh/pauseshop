import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import PopupApp from "../../src/popup/PopupApp";

const rootElement = document.getElementById("root");
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <PopupApp />
        </React.StrictMode>,
    );
} else {
    console.error("Root element not found for popup.");
}