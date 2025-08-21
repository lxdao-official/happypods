"use client"
import { Tooltip } from "@heroui/react";
import { useState, type ReactNode } from "react";

const TooltipWrap = ({content,className}: {content:ReactNode | string, className?: string}) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Tooltip 
          content={content} 
          isOpen={isOpen} 
          onOpenChange={setIsOpen}
          showArrow={true}
        >
            <i 
                className={`text-base cursor-pointer text-secondary ri-information-line hover:opacity-70 ${className}`} 
                onClick={()=>setIsOpen(!isOpen)}
            ></i>
        </Tooltip>
    )
}

export default TooltipWrap;