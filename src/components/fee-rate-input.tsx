"use client";

import { Input, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FeeRateInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  quickRates?: number[];
  showWarning?: boolean;
}

export default function FeeRateInput({
  value,
  onChange,
  label = "Milestone Fee Rate (%)",
  placeholder = "Enter fee rate percentage",
  className = "flex-1",
  quickRates = [1, 3, 5],
  showWarning = true,
}: FeeRateInputProps) {
  const [inputValue, setInputValue] = useState(value ? value.toString() : '');

  // 同步外部 value 变化到内部状态
  useEffect(() => {
    setInputValue(value ? value.toString() : '');
  }, [value]);

  const handleInputChange = (newValue: string) => {
    const numValue = Number(newValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100 && newValue !== '') {
      onChange(numValue);
      setInputValue(newValue);
    } else {
      onChange(0);
      setInputValue('0');
      toast.warning('Please enter a fee rate (0-100)');
    }
  };

  return (
    <div className="space-y-2">
      <Input
        variant="faded"
        type="number"
        label={label}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        isRequired={true}
        errorMessage={`Please enter a fee rate (0-100)`}
        className={className}
        min={0}
        max={100}
      />
      
      {showWarning && (
        <div className="flex items-center gap-1 text-sm text-warning-600">
          <i className="ri-error-warning-line"></i>
          <span>Upon Pod's completion of a milestone, <b className="text-red-500">{value || '~'}% </b> of its fee is collected as platform service fee.</span>
        </div>
      )}
    </div>
  );
}
