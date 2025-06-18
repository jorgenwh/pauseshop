import { useState, useEffect } from "react";
import { getSidebarPosition, setSidebarPosition } from "../storage";
import { SidebarPosition } from "../ui/types";
import { ToggleSidebarPositionMessage } from "../background/types";

const PopupApp = () => {
    const [position, setPosition] = useState<SidebarPosition>("left");

    useEffect(() => {
        getSidebarPosition().then(setPosition);
    }, []);

    const handleToggleSidebarPosition = () => {
        const newPosition = position === "left" ? "right" : "left";
        setSidebarPosition(newPosition).then(() => {
            setPosition(newPosition);
            const message: ToggleSidebarPositionMessage = {
                type: "toggleSidebarPosition",
            };
            chrome.runtime.sendMessage(message).catch((error) => {
                console.error("Error sending message:", error);
            });
        });
    };

    return (
        <div className="p-4 text-center font-sans">
            <h1 className="text-lg font-bold mb-2">PauseShop Settings</h1>
            <div className="flex items-center justify-center">
                <span className="mr-2">Sidebar Position:</span>
                <button
                    onClick={handleToggleSidebarPosition}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    {position === "left" ? "Left" : "Right"}
                </button>
            </div>
        </div>
    );
};

export default PopupApp;

