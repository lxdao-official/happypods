interface CardBoxProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleBg?: string;
  titleEnd?: React.ReactNode;
  contentBg?: string;
}

const CardBox = ({ title = "", children, className = "", titleBg='#FF6B6B', titleEnd, contentBg='var(--color-pink)' }: CardBoxProps) => {
  return (
    <div className={`w-full mx-auto text-black overflow-hidden rounded-lg ${className}`}
        style={{
            backgroundColor: contentBg,
            boxShadow: `5px 5px 0px ${contentBg}`
        }}
    >
      {/* 卡片容器 */}
      <div className="overflow-hidden border border-black rounded-lg">
        {/* 标题栏 */}
        <div className="px-4 py-2 border-b border-black md:p-4 x-6 " style={{backgroundColor: titleBg}}>
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