interface CardBoxProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleBg?: string;
  titleEnd?: React.ReactNode;
  contentBg?: string
}

const CardBox = ({ title = "", children, className = "", titleBg='var(--color-pink)', contentBg='#ffffff' }: CardBoxProps) => {
  return (
    <div className={`w-full mx-auto text-black shadow-medium overflow-hidden rounded-xl ${className}`}
        style={{
            backgroundColor: contentBg,
            // boxShadow: `5px 5px 0px ${shadowBg || 'black'}`,
            // border: `1px solid ${'black'}`
        }}
    >
      {/* 卡片容器 */}
      <div className="overflow-hidden rounded-xl">
        {/* 标题栏 */}
        <div className="px-4 py-2 md:p-4 x-6 " style={{background: titleBg}}>
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