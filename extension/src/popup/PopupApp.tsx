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
            className="p-5 text-center font-sans text-white bg-blue-500 border-2 border-purple-700"
        >
            <h1>React is working!</h1>
            <p>This popup is now rendered with React.</p>
            <p>
                If React were not working, this popup would appear blank or show
                only static HTML content.
            </p>
            <button
                onClick={handleToggleSidebarPosition}
                className="mt-2.5 p-2.5 px-5 bg-purple-700 text-white border-none rounded-md cursor-pointer"
            >
                Toggle Sidebar Position
            </button>
        </div>
    );
};

export default PopupApp;

