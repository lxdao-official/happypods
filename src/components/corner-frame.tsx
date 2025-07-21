import type { ReactNode } from "react";

interface CornerFrameProps {
  children: ReactNode;
  className?: string;
  cornerSize?: number;
  borderWidth?: number;
  cornerColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

const CornerFrame = ({
  children,
  className = "",
  cornerSize = 8,
  borderWidth = 1,
  cornerColor = "white",
  borderColor = "white",
  backgroundColor = "transparent"
}: CornerFrameProps) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundColor,
        border: `${borderWidth}px solid ${borderColor}`,
      }}
    >
      {/* 左上角 */}
      <div 
        className="absolute top-0 left-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: cornerColor,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* 右上角 */}
      <div 
        className="absolute top-0 right-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: cornerColor,
          transform: 'translate(50%, -50%)',
        }}
      />
      
      {/* 左下角 */}
      <div 
        className="absolute bottom-0 left-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: cornerColor,
          transform: 'translate(-50%, 50%)',
        }}
      />
      
      {/* 右下角 */}
      <div 
        className="absolute bottom-0 right-0"
        style={{
          width: cornerSize,
          height: cornerSize,
          backgroundColor: cornerColor,
          transform: 'translate(50%, 50%)',
        }}
      />
      
      {/* 内容区域 */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
};

export default CornerFrame; 