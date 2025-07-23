import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                /* 主题色 */
                background: "var(--color-background)",
                foreground: "var(--color-foreground)",
                /* 主要颜色 */
                primary: "var(--color-primary)",
                secondary: "var(--color-secondary)",
                /* 辅助色 */
                green2: "var(--color-green2)",
                purple2: "var(--color-purple2)",
                pink: "var(--color-pink)",
                red2: "var(--color-red2)",
                /* 功能色 */
                muted: "var(--color-muted)",
                accent: "var(--color-accent)",
                destructive: "var(--color-destructive)",
                border: "var(--color-border)",
                input: "var(--color-input)",
                ring: "var(--color-ring)",
                /* 保留一些默认颜色 */
                white: "var(--color-white)",
                black: "var(--color-black)",
                transparent: "var(--color-transparent)",
                current: "var(--color-current)",
            },
        }
    },
    darkMode: "class",
    plugins: [heroui()],
}