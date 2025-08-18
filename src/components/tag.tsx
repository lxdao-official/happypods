const Tag = ({children,className,color}:{children:React.ReactNode,className?:string,color?:'primary' | 'success' | 'warning' | 'error' | 'info'}) => {
    const colorMap:Record<string,string> = {
        primary: 'text-primary border-primary',
        success: 'text-success border-success',
        warning: 'text-warning border-warning',
        error: 'text-error border-error',
        info: 'text-info border-info',
    }
  return (
    <div className={`inline-block px-3 py-1 text-[10px] md:text-xs text-black border border-black rounded-full ${className} ${colorMap[color||'']}`}>
      {children}
    </div>
  );
};

export default Tag;