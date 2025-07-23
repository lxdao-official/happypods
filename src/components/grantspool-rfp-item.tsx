import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react";
import { useRef, useEffect, useState } from "react";

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
  const descRef = useRef<HTMLParagraphElement>(null);
  const [showMore, setShowMore] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (descRef.current) {
      // 检查内容是否溢出三行
      const el = descRef.current;
      setShowMore(el.scrollHeight > el.clientHeight + 2); // 容忍1-2px误差
    }
  }, [proposal.description]);

  return (
    <>
      <div
        className={`border border-black rounded-lg p-4 relative hover:shadow-md transition-shadow ${className}`}
        onClick={onClick}
      >
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          {proposal.title}
        </h3>
        <p
          ref={descRef}
          className="mb-4 text-xs text-gray-600 line-clamp-3 min-h-[3.6em]"
          style={{ WebkitLineClamp: 3 }}
        >
          {proposal.description}
        </p>
        <div className="flex items-center justify-between">
          {showMore ? (
            <span
              className="text-sm cursor-pointer text-primary hover:opacity-80"
              onClick={e => { e.stopPropagation(); onOpen(); }}
            >
              More
            </span>
          ) : <span />}
          <Button size="sm" className="bg-black"><span>Apply</span><i className="ri-arrow-right-line"></i></Button>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onClose} placement="center"
        classNames={{
          base: "border-2 bg-white border-black text-black outline-none",
        }}
      size="3xl">
        <ModalContent>
          <ModalHeader className="text-xl font-bold">{proposal.title}</ModalHeader>
          <ModalBody>
            <div className="pb-4 whitespace-pre-line">
              {proposal.description}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GrantspoolRFPItem; 