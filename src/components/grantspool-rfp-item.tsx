import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { useRef, useEffect, useState } from "react";
import NextLink from "next/link";
import ExpandableText from "./expandable-text";
import { replaceNewLine } from "~/lib/utils";
import { MarkdownRenderer } from "./Tiptap";

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
        className={`border border-black rounded-lg p-4 relative hover:shadow-medium transition-shadow ${className}`}
        onClick={onClick}
      >
        
        <div className="flex items-center justify-between">
          <h3 className="mb-2 text-base font-semibold text-gray-900">
            {proposal.title}
          </h3>
          <button 
            className="px-2 py-1 space-x-1 text-xs border border-black rounded-md hover:bg-black hover:text-white"
            onClick={() => onOpen()}
          >
            <i className="ri-arrow-right-line"></i>
          </button>
        </div>

      </div>
      
      <Modal isOpen={isOpen} onOpenChange={onClose} size="5xl" isDismissable={false}>
        <ModalContent>
          <ModalHeader className="text-xl font-bold">{proposal.title}</ModalHeader>
          <ModalBody className="max-h-[80vh] overflow-y-auto">
            <div className="pb-4">
              <MarkdownRenderer content={proposal.description} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" size="lg" variant="light" onPress={onClose}>Close</Button>
            <Button color="primary" size="lg" className="text-black" as={NextLink} href={`/pods/create?rfpId=${proposal.id}&gpId=${gpId}`}>Apply Now</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GrantspoolRFPItem; 