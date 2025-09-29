"use client";

import { Input, Button } from "@heroui/react";
import { useState, useEffect } from "react";

interface FeeRateInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  quickRates?: number[];
  showWarning?: boolean;
}

export default function FeeRateInput({
  value,
  onChange,
  label = "Milestone Fee Rate (%)",
  placeholder = "Enter fee rate percentage",
  isRequired = true,
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
    setInputValue(newValue);
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (newValue === '') {
      onChange(0);
    }
  };

  const handleQuickRateSelect = (rate: number) => {
    setInputValue(rate.toString());
    onChange(rate);
  };

  const isInvalid = inputValue === '' || Number(inputValue) < 0 || Number(inputValue) > 100;

  return (
    <div className="space-y-2">
      <Input
        variant="faded"
        type="number"
        label={label}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        isRequired={isRequired}
        isInvalid={isInvalid}
        errorMessage="Please enter a fee rate (0-100)"
        className={className}
        min={0}
        max={100}
        endContent={
          <div className="flex gap-2">
            {quickRates.map(rate => (
              <Button
                key={rate}
                variant={'bordered'}
                color="default"
                size="sm"
                onPress={() => handleQuickRateSelect(rate)}
              >
                {rate}%
              </Button>
            ))}
          </div>
        }
      />
      
      {showWarning && (
        <div className="flex items-center gap-1 text-sm text-warning-600">
          <i className="ri-error-warning-line"></i>
          <span>Upon Pod's completion of a milestone, {value || '~'}% of its fee is collected as platform service fee.</span>
        </div>
      )}
    </div>
  );
}
