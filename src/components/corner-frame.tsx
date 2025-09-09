import type { ReactNode } from "react";

interface CornerFrameProps {
  children: ReactNode;
  className?: string;
  cornerSize?: number;
  borderWidth?: number;
  backgroundColor?: string;
  color?: 'white' | 'black' | 'gray';
  style?:"shadow" | "border";
}

const CornerFrame = ({
  children,
  className = "",
  cornerSize = 8,
  borderWidth = 1,
  color="black",
  backgroundColor = "transparent",
  style = "shadow"
}: CornerFrameProps) => {
  const colorMap = {
    white: 'white',
    black: 'black',
    gray: 'var(--color-secondary)',
  };

  if(style === "shadow") {
    return (
      <div className={`relative ${className} shadow-medium bg-white rounded-xl p-6`}>
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundColor,
        border: `${borderWidth}px solid ${colorMap[color]}`,
      }}
    >
      {/* 左上角 */}
      <div 
        className="absolute top-0 left-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: colorMap[color],
          zIndex: 22,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* 右上角 */}
      <div 
        className="absolute top-0 right-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: colorMap[color],
          zIndex: 22,
          transform: 'translate(50%, -50%)',
        }}
      />
      
      {/* 左下角 */}
      <div 
        className="absolute bottom-0 left-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          zIndex: 22,
          backgroundColor: colorMap[color],
          transform: 'translate(-50%, 50%)',
        }}
      />
      
      {/* 右下角 */}
      <div 
        className="absolute bottom-0 right-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          zIndex: 22,
          backgroundColor: colorMap[color],
          transform: 'translate(50%, 50%)',
        }}
      />
      
      {/* 内容区域 */}
      <div className="relative z-10 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};

export default CornerFrame; 