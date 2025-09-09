"use client";

export const GridBackground = () => {
  return (
    <>
      {/* 弥散渐变背景层 */}
      <div
        className="fixed inset-0 w-full h-full z-[0]"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)
          `,
        }}
      />

      {/* PC端：网格背景 */}
      <div
        className="fixed inset-0 w-full h-full z-[2]"
        style={{
          // background: `
          //   linear-gradient(rgba(9, 9, 9, 0.041) 1px, transparent 1px),
          //   linear-gradient(90deg, rgba(26, 26, 26, 0.041) 1px, transparent 1px)
          // `,
          backgroundSize: '30px 30px',
          backgroundColor: 'transparent',
        }}
      />
    </>
  );
}; 