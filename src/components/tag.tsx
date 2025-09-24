export type TagColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' | 'inactive' | 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'brown' | 'gray'
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
        red: 'text-red-400 border-red-400 bg-red-400/10',
        yellow: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
        green: 'text-green-400 border-green-400 bg-green-400/10',
        blue: 'text-blue-400 border-blue-400 bg-blue-400/10',
        purple: 'text-purple-400 border-purple-400 bg-purple-400/10',
        orange: 'text-orange-400 border-orange-400 bg-orange-400/10',
        pink: 'text-pink-400 border-pink-400 bg-pink-400/10',
        brown: 'text-brown-400 border-brown-400 bg-brown-400/10',
        gray: 'text-gray-400 border-gray-400 bg-gray-400/10',
    }
  return (
    <div className={`inline-block px-2 py-[2px] text-[8px] md:text-[11px] text-black border border-black rounded-md ${className} ${colorMap[color||'default']}`}>
      {children}
    </div>
  );
};

export default Tag;