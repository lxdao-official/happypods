import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react";
import { useRef, useEffect, useState } from "react";
import NextLink from "next/link";
import ExpandableText from "./expandable-text";

interface GrantspoolRFPItemProps {
  proposal: {
    id: number;
    title: string;
    description: string;
    avatar?: string | null;
  };
  onClick?: () => void;
  className?: string;
  gpId: number;
} 

const GrantspoolRFPItem = ({ proposal, onClick, className = "", gpId }: GrantspoolRFPItemProps) => {
  const descRef = useRef<HTMLParagraphElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  
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
          <ExpandableText text={proposal.description} maxLines={3} />
        </p>
        <div className="flex items-center justify-between">
          
          <div
            className="text-sm cursor-pointer text-secondary hover:text-primary"
            onClick={e => { e.stopPropagation(); onOpen(); }}
          >
            <i className="text-xl ri-more-fill"></i>
          </div>
          
          <NextLink href={`/pods/create?rfpId=${proposal.id}&gpId=${gpId}`}>
            <Button size="sm" className="bg-black"><span>Apply</span><i className="ri-arrow-right-line"></i></Button>
          </NextLink>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" size="3xl">
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