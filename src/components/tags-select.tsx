import { Select, SelectItem } from "@heroui/react";
import { DEFAULT_TAGS } from "~/lib/config";

interface TagsSelectProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  availableTags?: string[];
}

export default function TagsSelect({
  selectedTags,
  onTagsChange,
  label = "Tags",
  placeholder = "Select tags",
  isRequired = false,
  availableTags = DEFAULT_TAGS
}: TagsSelectProps) {
  return (
    <div className="space-y-3">
      <Select
        label={label}
        variant="bordered"
        placeholder={'Select tags'}
        selectionMode="multiple"
        selectedKeys={new Set(selectedTags)}
        onSelectionChange={(keys) => {
          const newTags = Array.from(keys) as string[];
          onTagsChange(newTags);
        }}
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