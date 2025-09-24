"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Button } from "@heroui/react";

interface ExpandableTextProps {
  text: string | ReactNode;
  maxLines?: number;
  maxHeight?: string;
  showExpandButton?: boolean;
  expandText?: string;
  collapseText?: string;
  className?: string;
  textClassName?: string;
  buttonClassName?: string;
  buttonSize?: "sm" | "md" | "lg";
  buttonColor?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export default function ExpandableText({
  text,
  maxLines = 3,
  maxHeight,
  showExpandButton = false,
  expandText = "More",
  collapseText = "Less",
  className = "",
  textClassName = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // 检查文本是否需要截断
  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeightPx = maxHeight 
        ? parseInt(maxHeight) 
        : lineHeight * maxLines;
      
      // 检查内容是否超出最大高度
      const isOverflowing = element.scrollHeight > maxHeightPx;
      setShowButton(isOverflowing && showExpandButton);
    }
  }, [text, maxLines, maxHeight, showExpandButton]);

  // 计算样式
  const getTextStyle = () => {
    if (isExpanded) {
      return {};
    }
    
    if (maxHeight) {
      return {
        maxHeight,
        overflow: "hidden",
      };
    }
    
    return {
      display: "-webkit-box",
      WebkitLineClamp: maxLines,
      WebkitBoxOrient: "vertical" as const,
      overflow: "hidden",
      textOverflow: "ellipsis",
    };
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={textRef}
        className={`whitespace-pre-wrap break-words leading-[1.7em] ${textClassName}`}
        style={getTextStyle()}
      >
        {text}
      </div>
      
      {showButton && (
        <div className="flex justify-end">
          <div  onClick={handleToggle} className="flex items-center gap-1 cursor-pointer hover:opacity-70 text-primary">
            <span className="text-sm">{isExpanded ? collapseText : expandText}</span>
            <i className={`${!isExpanded ? "ri-skip-down-line" : "ri-skip-up-line"}`}></i> 
          </div>
        </div>
      )}
    </div>
  );
}
