"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@heroui/react";
import type { JsonValue } from "@prisma/client/runtime/library";
import { LinkDisplay } from "./link-display";

interface ApplicantInfo {
  id: number;
  name: string | null;
  avatar: string | null;
  walletAddress: string;
  email?: string | null;
  description?: string | null;
  links?: JsonValue;
}

interface ApplicantInfoModalProps {
  applicant: ApplicantInfo;
}

export default function ApplicantInfoModal({
  applicant,
}: ApplicantInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <i
        className="text-black cursor-pointer ri-information-line hover:opacity-70"
        onClick={handleOpen}
      ></i>

      <Modal isOpen={isOpen} onClose={handleClose} size="xl" isDismissable={false}>
        <ModalContent>
          <ModalHeader className="text-xl font-bold">Applicant Information</ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-4">
              {/* 头像和姓名 */}
              <div className="flex items-center gap-4">
                {applicant.avatar ? (
                  <img
                    src={applicant.avatar}
                    alt={applicant.name || "User Avatar"}
                    className="object-cover w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                    <i className="text-2xl0 ri-user-2-line"></i>
                  </div>
                )}
              </div>

              {/* 详细信息 */}
              <div className="space-y-3">
                {[
                  {
                    key: "name",
                    label: "Name",
                    value: applicant.name,
                    show: true,
                  },
                  {
                    key: "walletAddress",
                    label: "Wallet",
                    value: applicant.walletAddress,
                    show: true,
                  },
                  {
                    key: "email",
                    label: "Email",
                    value: applicant.email,
                    show: !!applicant.email,
                  },
                  {
                    key: "description",
                    label: "Bio",
                    value: applicant.description,
                    show: !!applicant.description,
                  },
                ].map(
                  ({ key, label, value, show }) =>
                    show && (
                      <div key={key} className="flex items-center gap-2">
                        <label className="flex-shrink-0 block mb-1 text-sm font-medium text-gray-600">
                          {label} :
                        </label>
                        <p
                          className={`break-all text-sm ${key === "description" ? "leading-relaxed" : ""}`}
                        >
                          {value}
                        </p>
                      </div>
                    ),
                )}

                {/* 链接信息 */}
                {applicant.links && typeof applicant.links === 'object' && (
                 <div className="!mt-8">
                    <LinkDisplay 
                      theme="light"
                      links={applicant.links as Record<string, string>}
                    />
                 </div>
                )}
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
