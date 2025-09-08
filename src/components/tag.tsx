export type TagColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' | 'inactive'
const Tag = ({children,className,color}:{
  children:React.ReactNode,
  className?:string,
  color?:TagColor
}) => {
    const colorMap:Record<string,string> = {
        primary: 'text-primary border-primary bg-green-400/10',
        success: 'text-success border-success bg-green-400/10',
        warning: 'text-warning border-warning bg-yellow-400/10',
        error: 'text-red-400 border-red-400 bg-red-400/10',
        info: 'text-info border-info bg-blue-400/10',
        default: 'text-gray-500 border-gray-400 bg-[#81818118]',
        inactive: 'text-inactive border-gray-400 bg-[#57575718]',
    }
  return (
    <div className={`inline-block px-2 py-[2px] text-[8px] md:text-[11px] text-black border border-black rounded-md ${className} ${colorMap[color||'default']}`}>
      {children}
    </div>
  );
};

export default Tag;