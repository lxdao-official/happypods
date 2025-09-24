"use client";
import React, { useState } from 'react';
import { MarkdownRenderer } from './Tiptap';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';

interface MdTextPreviewModalProps {
  markdown: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  buttonText?: string;
  showButton?: boolean;
  maxLines?: number;
}

const MdTextPreviewModal: React.FC<MdTextPreviewModalProps> = ({ 
  markdown, 
  className = '', 
  children, 
  title = 'Description', 
  footer,
  buttonText = 'Details',
  showButton = true,
  maxLines = 2
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle modal open/close
  const handleToggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <div className="relative">
        <div 
          className={`${className}`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight:'1.87em'
          }}
        >
          {children}
        </div>

        {showButton && (
          <div className="absolute bottom-[0px] right-0 text-xs text-primary hover:text-sm transition-all">
            <button 
              onClick={handleToggleModal}
              className='flex items-center gap-1'
              style={{
                background:"linear-gradient(to right, rgba(255, 255, 255, 0), #ffffff 40%)",
                padding:"0 10px 0 60px",
              }}
            >
              <i className="text-base ri-eye-line"></i>
              <b>{buttonText}</b>
            </button>
          </div>
        )}
      </div>
      {/*  */}

      {/* Modal for full Markdown rendering */}
      <Modal isOpen={isModalOpen} onClose={handleToggleModal} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {title}
          </ModalHeader>
          <ModalBody>
            <MarkdownRenderer content={markdown} />
          </ModalBody>
          {footer && <ModalFooter>{footer}</ModalFooter>}
        </ModalContent>
      </Modal>
    </>
  );
};

export default MdTextPreviewModal;
