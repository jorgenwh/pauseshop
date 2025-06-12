import React from "react";

const PopupApp: React.FC = () => {
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
        </div>
    );
};

export default PopupApp;
