import {Tooltip} from "@heroui/react";

export default function TooltipInfo({content,className,width}: {content: string,className?: string,width?: string}) {
  return (
    <Tooltip content={content} className={`w-${width}`} showArrow={true}>
      <i className={`ri-information-line ${className} cursor-pointer text-secondary hover:text-primary text-sm`}></i>   
    </Tooltip>
  );
}