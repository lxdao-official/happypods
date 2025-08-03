import { Select, SelectItem } from "@heroui/react";

interface TagsSelectProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  availableTags?: string[];
}

// 默认可用的标签列表
const DEFAULT_TAGS = [
  "DeFi", "NFT", "GameFi", "Infrastructure", "DAO", "Privacy", 
  "Scalability", "Interoperability", "AI/ML", "Social Impact",
  "Education", "Healthcare", "Finance", "Gaming", "Art", "Music",
  "Environment", "Governance", "Security", "Analytics"
];

export default function TagsSelect({
  selectedTags,
  onTagsChange,
  label = "Tags",
  placeholder = "Select tags",
  description = "Choose relevant tags to help others discover your project",
  isRequired = false,
  availableTags = DEFAULT_TAGS
}: TagsSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      <Select
        variant="bordered"
        placeholder={placeholder}
        selectionMode="multiple"
        selectedKeys={new Set(selectedTags)}
        onSelectionChange={(keys) => {
          const newTags = Array.from(keys) as string[];
          onTagsChange(newTags);
        }}
        description={description}
        isRequired={isRequired}
      >
        {availableTags.map((tag) => (
          <SelectItem key={tag}>
            {tag}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
} 