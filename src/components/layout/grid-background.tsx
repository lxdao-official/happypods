"use client";

export const GridBackground = () => {
  return (
    <>
      
      {/* PC端：网格背景 */}
      <div 
        className="fixed inset-0 w-full h-full z-[1]"
        style={{
          background: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundColor: '#1F1F1D',
        }}
      />
    </>
  );
}; 