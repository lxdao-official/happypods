import { useState } from "react";
import { Input, Textarea, Button, DatePicker } from "@heroui/react";
import { parseDate, CalendarDate } from "@internationalized/date";
import CornerFrame from "~/components/corner-frame";
import EdgeLine from "./edge-line";

interface Milestone {
  id: string;
  deadline: string; // ISO date string
  amount: string;
  description: string;
}

interface MilestoneSectionProps {
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
}

const PRESET_AMOUNTS = [100, 300, 500];

const MilestoneSection = ({ milestones, onMilestonesChange }: MilestoneSectionProps) => {
  const addMilestone = () => {
    if (milestones.length >= 3) return;
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      deadline: "",
      amount: "",
      description: ""
    };
    onMilestonesChange([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      onMilestonesChange(milestones.filter(milestone => milestone.id !== id));
    }
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    onMilestonesChange(
      milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const handleAmountChange = (id: string, amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0 || numAmount > 500) {
      return;
    }
    updateMilestone(id, "amount", amount);
  };

  const handlePresetAmount = (id: string, presetAmount: number) => {
    updateMilestone(id, "amount", presetAmount.toString());
  };

  // DatePicker 相关
  const handleDateChange = (id: string, date: CalendarDate | null) => {
    if (date) {
      updateMilestone(id, "deadline", date.toString());
    } else {
      updateMilestone(id, "deadline", "");
    }
  };

  return (
    <CornerFrame backgroundColor="var(--color-background)">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-xl">
          <span>Milestone Information</span>
        </h2>
        {milestones.length < 3 && (
          <Button
            color="success"
            size="sm"
            onPress={addMilestone}
            startContent={<i className="ri-add-line"></i>}
          >
            Add Milestone
          </Button>
        )}
      </div>
      <div className="space-y-8">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Milestone #{index + 1}</h3>
              {milestones.length > 1 && (
                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  onPress={() => removeMilestone(milestone.id)}
                  startContent={<i className="ri-delete-bin-line"></i>}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {/* Deadline & Amount in one row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Deadline */}
                <DatePicker
                  label="Deadline"
                  value={milestone.deadline ? parseDate(milestone.deadline.split("T")[0] ?? "") : null}
                  onChange={date => handleDateChange(milestone.id, date)}
                  description="Select milestone deadline"
                  showMonthAndYearPickers
                />
                {/* Amount */}
                <Input
                variant="bordered"
                  type="number"
                  label="Amount (USDC)"
                  value={milestone.amount}
                  onChange={e => handleAmountChange(milestone.id, e.target.value)}
                  placeholder="Enter amount"
                  description="Amount between 0-500 USDC"
                  min="0"
                  max="500"
                  step="0.01"
                  endContent={
                    <div className="flex gap-2">
                      {PRESET_AMOUNTS.map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePresetAmount(milestone.id, amount)}
                          className="px-2 py-1 text-sm text-gray-500 border-gray-500 rounded-md border-1 hover:border-gray-300 hover:text-white"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  }
                />
              </div>
              {/* Description */}
              <Textarea
                variant="bordered"
                label="Milestone Description"
                value={milestone.description}
                onChange={e => updateMilestone(milestone.id, "description", e.target.value)}
                placeholder="Describe the specific goals and deliverables for this milestone"
                minRows={3}
                description="Detailed description of the work to be completed in this milestone"
              />
            </div>
            {index < milestones.length - 1 && <EdgeLine className="mt-6" />}
          </div>
        ))}
      </div>
    </CornerFrame>
  );
};

export default MilestoneSection; 