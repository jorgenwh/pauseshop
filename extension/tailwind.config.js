/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{ts,js,html}",
        "./src/ui/**/*.ts",
        "./src/popup/**/*.html",
    ],
    theme: {
        extend: {
            fontSize: {
                "2-and-half-xl": "1.7rem", // Custom size between 2xl (1.5rem) and 3xl (1.875rem)
            },
            fontFamily: {
                inter: [
                    "Inter",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
            },
            colors: {
                pauseshop: {
                    primary: "#4F46E5", // indigo-600
                    secondary: "#6366F1", // indigo-500
                    accent: "#EC4899", // pink-500
                    glass: "rgba(20, 30, 50, 0.7)", // Slightly less transparent
                    "glass-light": "rgba(70, 90, 120, 0.7)", // Slightly less transparent
                    "glass-lighter": "rgba(120, 140, 170, 0.65)", // Slightly less transparent
                    "product-name-text": "rgb(255, 140, 0)", // Orange
                    "category-text": "rgb(255, 193, 7)", // Amber/Yellow
                },
            },
            backdropBlur: {
                pauseshop: "10px", // Increased blur
            },
            boxShadow: {
                pauseshop: "-10px 0 30px rgba(0, 0, 0, 0.5)",
                "pauseshop-card":
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                "pauseshop-hover":
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            animation: {
                "slide-in-right": "slideInRight 0.5s ease-in-out",
                "slide-out-right": "slideOutRight 0.5s ease-in-out",
                "fade-in": "fadeIn 0.3s ease-in-out",
                "fade-out": "fadeOut 0.3s ease-in-out",
                expand: "expand 0.4s ease-in-out forwards",
                collapse: "collapse 0.4s ease-in-out forwards",
            },
            keyframes: {
                slideInRight: {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                slideOutRight: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(100%)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                fadeOut: {
                    "0%": { opacity: "1" },
                    "100%": { opacity: "0" },
                },
                expand: {
                    "0%": {
                        maxHeight: "0",
                        opacity: "0",
                        transform: "translateY(-10px)",
                    },
                    "100%": {
                        maxHeight: "50rem",
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                },
                collapse: {
                    "0%": {
                        maxHeight: "50rem",
                        opacity: "1",
                        transform: "translateY(0)",
                    },
                    "100%": {
                        maxHeight: "0",
                        opacity: "0",
                        transform: "translateY(-10px)",
                    },
                },
            },
            spacing: {
                5: "1.25rem", // 20px - Added for space-y-5
                17: "4.25rem", // 68px
                18: "4.5rem", // 72px
                24: "6rem", // 96px - New size for thumbnail
                32: "8rem", // 128px - New size for thumbnail
                88: "22rem", // 352px
                100: "25rem", // 400px - sidebar width
                112: "28rem", // 448px
                128: "32rem", // 512px
                200: "50rem", // 800px - Custom max-height for expansion
            },
            width: {
                68: "17rem", // 272px
            },
            height: {
                68: "17rem", // 272px
            },
            zIndex: {
                999998: "999998",
                999999: "999999",
            },
        },
    },
    plugins: [],
    // Safelist grid-cols-2 for dynamic class generation
    safelist: [
        "grid-cols-2",
        "animation-expand",
        "animation-collapse",
        "text-product-name-text",
        "text-category-text",
        "space-y-5",
    ],
    // Ensure we don't conflict with existing styles
    corePlugins: {
        preflight: false, // Disable Tailwind's CSS reset to avoid conflicts
    },
};
