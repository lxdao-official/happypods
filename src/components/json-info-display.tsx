"use client";

interface JsonInfoDisplayProps {
  data: Record<string, any>;
  nameMapping: Record<string, string>;
  className?: string;
}

export default function JsonInfoDisplay({
  data,
  nameMapping,
  className = "",
}: JsonInfoDisplayProps) {
  // 将对象转换为数组
  const items = Object.entries(data).map(([key, value]) => ({
    key,
    name: nameMapping[key] || key,
    value: String(value)
  }));

  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.key} className="py-2 text-xs border-b border-gray-100 last:border-b-0">
          <b className="font-medium">{item.name}: </b>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
} 