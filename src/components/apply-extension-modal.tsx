import { Button, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react";

interface ApplyExtensionModalProps {
  milestoneId: string | number;
}

export default function ApplyExtensionModal({ milestoneId }: ApplyExtensionModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button 
        size="sm" 
        color="danger" 
        variant="flat"
        onPress={onOpen}
      >
        Apply Extension
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onClose} 
        placement="center"
        size="md"
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            Apply for Extension
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-4">
              <div className="p-4 border border-white rounded-lg bg-pink">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-red-500 text-xl mt-0.5"></i>
                  <div>
                    <h3 className="font-semibold text-red-500">
                      Contact Administrator
                    </h3>
                    <p className="text-sm leading-relaxed text-black">
                      To request a deadline extension, please contact the grants pool administrator directly. 
                      After communication and approval, the milestone deadline can be adjusted.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-secondary">Contact Methods:</h4>
                <div className="space-y-1 text-sm text-white">
                  <div className="flex items-center gap-2">
                    <i className="ri-mail-line"></i>
                    <span>Email: admin@grantpool.example</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-telegram-line"></i>
                    <span>Telegram: @grantpool_admin</span>
                  </div>
                </div>
              </div>

              
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 