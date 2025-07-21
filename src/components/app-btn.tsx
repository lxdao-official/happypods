"use client"
import { Button, type ButtonProps } from "@heroui/react";

const AppBtn = ({children, btnProps={color:"primary"},className=""}: {children: React.ReactNode, btnProps?: ButtonProps, className?: string}) => {
  return (
    <div className={`p-[3px] bg-white rounded-md border-1 border-black ${className}`}>
        <Button {...btnProps} className={`font-bold text-[14px] text-black border-black rounded-md border-1 ${btnProps.color === "primary" ? "bg-purple" : ""}`}  >
            {children}
        </Button>
    </div>
  );
}

export default AppBtn;