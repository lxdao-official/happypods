import { Button } from "@heroui/button";

interface GrantspoolRFPItemProps {
  proposal: {
    id: number;
    title: string;
    description: string;
    avatar?: string | null;
  };
  onClick?: () => void;
  className?: string;
} 

const GrantspoolRFPItem = ({ proposal, onClick, className = "" }: GrantspoolRFPItemProps) => {
  return (
    <div
      className={`border border-black rounded-lg p-4 relative hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <h3 className="mb-2 text-sm font-semibold text-gray-900">
        {proposal.title}
      </h3>
      <p className="mb-4 text-xs text-gray-600 line-clamp-3">
        {proposal.description}
      </p>
      
      <div className="flex items-center justify-between">
          <span className="text-sm cursor-pointer text-primary hover:opacity-80">More</span>
          <Button size="sm" className="bg-black"><span>Apply</span><i className="ri-arrow-right-line"></i></Button>
      </div>
      {/*  */}

    </div>
  );
};

export default GrantspoolRFPItem; 