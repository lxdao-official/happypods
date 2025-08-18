interface CardBoxProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleBg?: string;
  titleEnd?: React.ReactNode;
}

const CardBox = ({ title = "", children, className = "", titleBg='#FF6B6B', titleEnd }: CardBoxProps) => {
  const titleBgStyle = {
    background: titleBg,
  }
  return (
    <div className={`w-full mx-auto text-black bg-pink  overflow-hidden rounded-lg ${className}`}
        style={{
            boxShadow: '5px 5px 0px var(--color-pink)'
        }}
    >
      {/* 卡片容器 */}
      <div className="overflow-hidden border border-black rounded-lg">
        {/* 标题栏 */}
        <div className="py-2 px-4 md:p-4 border-b border-black x-6 " style={{backgroundColor: titleBg}}>
          {title}
        </div>
        
        {/* 主体内容区域 */}
        <div className="md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CardBox;