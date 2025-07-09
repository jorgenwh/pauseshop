import { useState, useEffect } from "react";
import { sidebarPosition, clickHistory } from "../storage";
import { SidebarPosition } from "../ui/types";
import { ToggleSidebarPositionMessage } from "../background/types";
import "../ui/css/base.css";

const PopupApp = () => {
    const [position, setPosition] = useState<SidebarPosition>("left");

    useEffect(() => {
        sidebarPosition.getValue().then(setPosition);
    }, []);

    const handleToggleSidebarPosition = async () => {
        const newPosition = position === "left" ? "right" : "left";
        await sidebarPosition.setValue(newPosition);
        setPosition(newPosition);

        // Get the current tab ID
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const tabId = tabs[0]?.id;
        const message: ToggleSidebarPositionMessage = {
            type: "toggleSidebarPosition",
            tabId: tabId,
        };
        browser.runtime.sendMessage(message).catch(() => {
            // Error sending toggle position message
        });
    };

    const handleClearClickHistory = async () => {
        await clickHistory.setValue([]);
    };

    return (
        <div
            className="p-4 text-center font-sans"
            style={{ backgroundColor: "var(--freezeframe-bg)" }}
        >
            <h1 className="text-lg font-bold mb-2" style={{ color: "white" }}>
                FreezeFrame Settings
            </h1>
            <div className="flex items-center justify-center">
                <span className="mr-2" style={{ color: "white" }}>
                    Sidebar Position:
                </span>
                <button
                    onClick={handleToggleSidebarPosition}
                    className="px-4 py-2 text-white rounded-md w-20 transition-all duration-100 active:scale-95 active:opacity-80"
                    style={{ backgroundColor: "var(--freezeframe-theme-trim-color)" }}
                >
                    {position === "left" ? "Left" : "Right"}
                </button>
            </div>
            <div className="flex items-center justify-center mt-4">
                <button
                    onClick={handleClearClickHistory}
                    className="px-4 py-2 text-white rounded-md transition-all duration-100 active:scale-95 active:opacity-80"
                    style={{ backgroundColor: "var(--freezeframe-theme-trim-color)" }}
                >
                    Clear History
                </button>
            </div>
        </div>
    );
};

export default PopupApp;


