import React from "react";
import { ToggleSidebarPositionMessage } from "../background/types";

const PopupApp: React.FC = () => {
    const handleToggleSidebarPosition = () => {
        const message: ToggleSidebarPositionMessage = {
            action: "toggleSidebarPosition",
        };
        chrome.runtime.sendMessage(message).catch((error) => {
            console.error("Error sending message:", error);
        });
    };

    return (
        <div
            style={{
                padding: "20px",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
                color: "purple",
                backgroundColor: "lightyellow",
                border: "2px solid purple",
            }}
        >
            <h1>React is working!</h1>
            <p>This popup is now rendered with React.</p>
            <p>
                If React were not working, this popup would appear blank or show
                only static HTML content.
            </p>
            <button
                onClick={handleToggleSidebarPosition}
                style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    backgroundColor: "purple",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                }}
            >
                Toggle Sidebar Position
            </button>
        </div>
    );
};

export default PopupApp;
