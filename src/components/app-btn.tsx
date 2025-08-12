"use client"
import { Button, type ButtonProps } from "@heroui/react";

const AppBtn = ({children, btnProps={color:"primary"},className=""}: {children: React.ReactNode, btnProps?: ButtonProps, className?: string}) => {
  const {color, onPress, ...rest} = btnProps;
  const colorMap: Record<string, string> = {
    primary: "bg-purple-400 hover:bg-purple-500",
    success: "bg-green-400 hover:bg-green-500",
    warning: "bg-yellow-400 hover:bg-yellow-500",
    danger: "bg-red-400 hover:bg-red-500",
    info: "bg-blue-400 hover:bg-blue-500",
    light: "bg-gray-400 hover:bg-gray-500",
    dark: "bg-black hover:bg-black/80",
  }

  return (
    <div className={`p-[3px] bg-white rounded-md border-1 border-black ${className}`}>
        <button {...rest} onClick={onPress as ()=>void} className={`font-bold text-[14px] text-black border-black rounded-md border-1 py-1 px-4 ${colorMap[color || "primary"]}`}  >
            {children}
        </button>
    </div>
  );
}

export default AppBtn;