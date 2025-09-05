import { useState } from "react";
import { Input, Textarea, Button } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import EdgeLine from "./edge-line";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface RFP {
  id: string;
  title: string;
  description: string;
}

interface RFPSectionProps {
  rfps: RFP[];
  onRfpsChange: (rfps: RFP[]) => void;
  isEdit?: boolean;
  grantsPoolId?: number;
}

const RFPSection = ({ rfps, onRfpsChange, isEdit = false, grantsPoolId }: RFPSectionProps) => {
  const [deletingRfpId, setDeletingRfpId] = useState<string | null>(null);

  // 删除 RFP 的 mutation
  const deleteRfpMutation = api.grantsPool.deleteRfp.useMutation();

  const addRFP = () => {
    const newRFP: RFP = {
      id: `new-${Date.now()}`,
      title: "",
      description: ""
    };
    onRfpsChange([...rfps, newRFP]);
  };

  const removeRFP = async (id: string) => {
    if (rfps.length <= 1) {
      toast.error("At least one RFP must be kept");
      return;
    }

    // 如果是编辑模式且是现有的 RFP（不是以 'new-' 开头的ID）
    if (isEdit && grantsPoolId && !id.startsWith('new-')) {
      try {
        setDeletingRfpId(id);
        await deleteRfpMutation.mutateAsync({
          rfpId: parseInt(id),
          grantsPoolId: grantsPoolId,
        });
        toast.success("RFP deleted successfully");
        onRfpsChange(rfps.filter(rfp => rfp.id !== id));
      } catch (error: any) {
        toast.error(error.message || "Failed to delete RFP");
      } finally {
        setDeletingRfpId(null);
      }
    } else {
      // 对于新创建的 RFP 或创建模式，直接从本地状态中移除
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
          <span>Request-For-Proposal</span>
          {/* <i className="ri-question-line"></i> */}
        </h2>
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
                  isLoading={deletingRfpId === rfp.id}
                  startContent={!deletingRfpId && <i className="ri-delete-bin-line"></i>}
                >
                  {deletingRfpId === rfp.id ? "Deleting..." : "Remove"}
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
                isRequired
                errorMessage="Please enter an RFP title"
              />

              <Textarea
                variant="bordered"
                label="RFP Description"
                value={rfp.description}
                onChange={(e) => updateRFP(rfp.id, "description", e.target.value)}
                placeholder="Describe the background and objectives of the RFP"
                minRows={3}
                isRequired
                errorMessage="Please enter an RFP description"
              />

            </div>
            
            {index < rfps.length - 1 && (
                <EdgeLine className="mt-6"/> 
            )}
          </div>
        ))}


          <div className="flex justify-end mt-6">
            <Button
              color="success"
              size="sm"
              onPress={addRFP}
              startContent={<i className="ri-add-line"></i>}
            >
              Add RFP
            </Button>
          </div>
          
      </div>
    </CornerFrame>
  );
};

export default RFPSection; 