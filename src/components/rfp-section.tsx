import { useState } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import EdgeLine from "./edge-line";

interface RFP {
  id: string;
  title: string;
  description: string;
}

interface RFPSectionProps {
  rfps: RFP[];
  onRfpsChange: (rfps: RFP[]) => void;
}

const RFPSection = ({ rfps, onRfpsChange }: RFPSectionProps) => {
  const addRFP = () => {
    const newRFP: RFP = {
      id: Date.now().toString(),
      title: "",
      description: ""
    };
    onRfpsChange([...rfps, newRFP]);
  };

  const removeRFP = (id: string) => {
    if (rfps.length > 1) {
      onRfpsChange(rfps.filter(rfp => rfp.id !== id));
    }
  };

  const updateRFP = (id: string, field: keyof RFP, value: string) => {
    onRfpsChange(
      rfps.map(rfp => 
        rfp.id === id ? { ...rfp, [field]: value } : rfp
      )
    );
  };

  return (
    <CornerFrame backgroundColor="var(--color-background)" color="gray">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-xl">
          <span>RFP Information</span>
          <i className="ri-question-line"></i>
        </h2>
        <Button
          color="success"
          size="sm"
          onPress={addRFP}
          startContent={<i className="ri-add-line"></i>}
        >
          Add RFP
        </Button>
      </div>
      
      <div className="space-y-8">
        {rfps.map((rfp, index) => (
          <div key={rfp.id} className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">RFP #{index + 1}</h3>
              {rfps.length > 1 && (
                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  onPress={() => removeRFP(rfp.id)}
                  startContent={<i className="ri-delete-bin-line"></i>}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="space-y-6">
              <Input
                variant="bordered"
                type="text"
                label="RFP Title"
                value={rfp.title}
                onChange={(e) => updateRFP(rfp.id, "title", e.target.value)}
                placeholder="RFP Title"
              />

              <Textarea
                variant="bordered"
                label="RFP Description"
                value={rfp.description}
                onChange={(e) => updateRFP(rfp.id, "description", e.target.value)}
                placeholder="Describe the background and objectives of the RFP"
                minRows={3}
              />

            </div>
            
            {index < rfps.length - 1 && (
                <EdgeLine className="mt-6"/> 
            )}
          </div>
        ))}
      </div>
    </CornerFrame>
  );
};

export default RFPSection; 