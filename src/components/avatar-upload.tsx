'use client';

import React, { useRef, useState } from 'react';
import { Spinner } from "@heroui/react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { clsx } from "clsx";

interface AvatarUploadProps {
  onUpload: (publicUrl: string) => void;
  initialUrl?: string;
  previewSize?: "sm" | "md" | "lg";
  maxSize?: number; // Max file size in MB
  acceptedTypes?: string[];
}

export default function AvatarUpload({
  onUpload,
  initialUrl = '',
  previewSize = "md",
  maxSize = 2, // Default 2MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrlMutation = api.upload.generateAvatarUploadUrl.useMutation();

  const getPreviewSizeClass = () => {
    switch (previewSize) {
      case "sm": return "w-16 h-16";
      case "lg": return "w-32 h-32";
      default: return "w-24 h-24";
    }
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Unsupported file type. Please select ${acceptedTypes.join(', ')} format files`;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size cannot exceed ${maxSize}MB`;
    }
    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Show Base64 preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const presignedResult = await generateUploadUrlMutation.mutateAsync({
        fileType: file.type,
        fileSize: file.size,
      });

      const uploadResponse = await fetch(presignedResult.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      setPreviewUrl(presignedResult.publicUrl);
      onUpload(presignedResult.publicUrl);
      toast.success("Avatar uploaded successfully!");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed, please try again';
      toast.error(errorMessage);
      setPreviewUrl(initialUrl); // Revert to initial on failure
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        className={clsx(
          "relative group cursor-pointer",
          "rounded-full border-2 border-dashed border-gray-300",
          "flex items-center justify-center bg-gray-50",
          "transition-all hover:border-blue-400 hover:bg-blue-50",
          getPreviewSizeClass()
        )}
        onClick={triggerFileSelect}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Avatar Preview"
            className="object-cover w-full h-full rounded-full"
          />
        ) : (
          <i className="text-2xl text-gray-400 ri-camera-line"></i>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black rounded-full bg-opacity-40">
            <Spinner size="md" color="white" />
          </div>
        )}

        {!isUploading && previewUrl && (
          <>
            <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-full pointer-events-none group-hover:bg-opacity-30">
              <i className="text-xl text-white opacity-0 ri-pencil-line group-hover:opacity-100"></i>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute p-1 text-white transition-colors bg-red-500 rounded-full opacity-0 -top-1 -right-1 hover:bg-red-600 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <i className="text-sm ri-close-line"></i>
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-left text-gray-500">
        <div>Click avatar to upload</div>
        <div>Max {maxSize}MB, supports {acceptedTypes.map(t => t.split('/')[1]).join(', ')}</div>
      </div>
    </div>
  );
}