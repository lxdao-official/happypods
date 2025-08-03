import { Input } from "@heroui/react";

interface AvatarInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  size?: "sm" | "md" | "lg";
  previewSize?: "sm" | "md" | "lg";
}

export default function AvatarInput({
  value,
  onChange,
  label = "Avatar URL",
  placeholder = "https://example.com/avatar.jpg",
  description = "Enter the URL for your avatar image.",
  isRequired = false,
  size = "md",
  previewSize = "md"
}: AvatarInputProps) {
  const getPreviewSizeClass = () => {
    switch (previewSize) {
      case "sm":
        return "w-6 h-6";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  return (
    <Input
      variant="bordered"
      type="url"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      description={description}
      isRequired={isRequired}
      size={size}
      endContent={
        value && (
          <img
            src={value}
            alt="Avatar Preview"
            className={`object-cover rounded-full ${getPreviewSizeClass()}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )
      }
    />
  );
} 