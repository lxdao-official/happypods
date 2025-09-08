import { Select, SelectItem } from "@heroui/react";
import { DEFAULT_TAGS } from "~/lib/config";
import { toast } from "sonner";

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
  isRequired = false,
  availableTags = DEFAULT_TAGS
}: TagsSelectProps) {
  return (
    <div className="space-y-3">
      <Select
        label={label}
        variant="faded"
        placeholder={'Select tags'}
        selectionMode="multiple"
        selectedKeys={new Set(selectedTags)}
        onSelectionChange={(keys) => {
          const newTags = Array.from(keys) as string[];
          // 限制最多选择3个标签
          if (newTags.length <= 3) {
            onTagsChange(newTags);
          } else {
            toast.warning("You can only select up to 3 tags");
          }
        }}
        isRequired={isRequired}
        description={`Selected ${selectedTags.length}/3 tags`}
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