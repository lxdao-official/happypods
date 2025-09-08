import React from "react";

interface EdgeLineProps {
  direction?: "horizontal" | "vertical";
  color?: string;
  thickness?: number; // 线的粗细
  nodeSize?: number; // 节点大小
  className?: string;
  style?: React.CSSProperties;
}

const EdgeLine = ({
  direction = "horizontal",
  color = "#000000",
  thickness = 1,
  nodeSize = 8,
  className = "",
  style = {},
}: EdgeLineProps) => {
  const isHorizontal = direction === "horizontal";

  // 容器宽高自适应，默认100%
  const containerStyle: React.CSSProperties = isHorizontal
    ? { width: "100%", height: nodeSize, ...style }
    : { width: nodeSize, height: "100%", ...style };

  // 线段自适应
  const lineStyle: React.CSSProperties = isHorizontal
    ? {
        width: "100%",
        height: thickness,
        background: color,
        position: "absolute",
        left: 0,
        top: `calc(50% - ${thickness / 2}px)`
      }
    : {
        width: thickness,
        height: "100%",
        background: color,
        position: "absolute",
        top: 0,
        left: `calc(50% - ${thickness / 2}px)`
      };

  // 圆形节点
  const nodeStyle: React.CSSProperties = {
    width: nodeSize,
    height: nodeSize,
    background: color,
    position: "absolute",
    zIndex: 2,
  };

  return (
    <div
      className={`relative ${isHorizontal ? "flex items-center" : "flex flex-col justify-center"} ${className}`}
      style={containerStyle}
    >
      {/* 左/上节点 */}
      <div
        style={{
          ...nodeStyle,
          left: isHorizontal ? 0 : undefined,
          top: isHorizontal ? undefined : 0,
        }}
      />
      {/* 线段 */}
      <div style={lineStyle} />
      {/* 右/下节点 */}
      <div
        style={{
          ...nodeStyle,
          right: isHorizontal ? 0 : undefined,
          bottom: isHorizontal ? undefined : 0,
          left: isHorizontal ? undefined : 0,
          top: isHorizontal ? 0 : undefined,
        }}
      />
    </div>
  );
};

export default EdgeLine; 