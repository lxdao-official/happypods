"use client";

export const GridBackground = () => {
  return (
    <>
      
      {/* PC端：网格背景 */}
      <div 
        className="fixed inset-0 w-full h-full z-[1]"
        style={{
          background: `
            linear-gradient(rgba(9, 9, 9, 0.041) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 26, 26, 0.041) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          // backgroundColor: 'var(--color-background)',
        }}
      />
    </>
  );
}; 