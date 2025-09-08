import { Input, Textarea, Button, DatePicker } from "@heroui/react";
import { parseDate, type DateValue, getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import CornerFrame from "~/components/corner-frame";
import EdgeLine from "./edge-line";
import { DEFAULT_MILESTONE_AMOUNTS } from "~/lib/config";

interface Milestone {
  id: string;
  title: string;
  deadline: string; // ISO date string
  amount: string;
  description: string;
}

interface MilestoneSectionProps {
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
  info?: React.ReactNode;
  minMilestoneCount?: number;
  maxMilestoneCount?: number;
}

const MilestoneSection = ({ milestones, onMilestonesChange, info, minMilestoneCount = 1, maxMilestoneCount = 3 }: MilestoneSectionProps) => {
  const addMilestone = () => {
    if (milestones.length >= maxMilestoneCount) return;
    const newMilestone: Milestone = {
      id: `${Date.now()}`,
      title: "",
      deadline: "",
      amount: DEFAULT_MILESTONE_AMOUNTS.DEFAULT,
      description: ""
    };
    onMilestonesChange([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > minMilestoneCount) {
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
  const handleDateChange = (id: string, date: any) => {
    if (date) {
      updateMilestone(id, "deadline", date.toString());
    } else {
      updateMilestone(id, "deadline", "");
    }
  };

  const minDate = (index: number): any => {
    if (index === 0) {
      return today(getLocalTimeZone()).add({ days: 1 });
    }
    const currentMilestone = milestones[index-1];
    if (currentMilestone?.deadline) {
      try {
        const currentDeadline = parseDate(currentMilestone.deadline.split("T")[0] ?? "");
        return currentDeadline.add({ days: 1 });
      } catch {
        return today(getLocalTimeZone()).add({ days: 1 });
      }
    }
    return today(getLocalTimeZone()).add({ days: 1 });
  };

  const getDateValue = (deadline: string): any => {
    if (!deadline) return null;
    try {
      return parseDate(deadline.split("T")[0] ?? "");
    } catch {
      return null;
    }
  };

  return (
    <CornerFrame backgroundColor="var(--color-background)" color="gray">
      <div className="flex flex-col mb-6">
        <h2 className="flex items-center gap-2 text-xl">
          <span>Milestone Information</span>
        </h2>
        <div>{info}</div>
      </div>
      <div className="space-y-8">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Milestone #{index + 1}</h3>
              {milestones.length > minMilestoneCount && (
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
              {/* Title */}
              <Input
                variant="faded"
                type="text"
                label="Milestone Title"
                value={milestone.title}
                onChange={e => updateMilestone(milestone.id, "title", e.target.value)}
                placeholder="Enter milestone title"
              />
              
              {/* Deadline & Amount in one row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Deadline */}
                <DatePicker
                  label="Deadline"
                  minValue={minDate(index)}
                  value={getDateValue(milestone.deadline)}
                  onChange={date => handleDateChange(milestone.id, date)}
                  showMonthAndYearPickers
                />
                {/* Amount */}
                <Input
                variant="faded"
                  type="number"
                  label="Amount"
                  value={milestone.amount}
                  onChange={e => handleAmountChange(milestone.id, e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  max="500"
                  step="0.0001"
                  errorMessage="Please enter a valid amount"
                  endContent={
                    <div className="flex gap-2">
                      {DEFAULT_MILESTONE_AMOUNTS.OPTIONS.map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handlePresetAmount(milestone.id, amount)}
                          className="px-2 py-1 border-gray-500 rounded-md text-sm0 border-1 hover:border-gray-300 hover:text-white"
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
                variant="faded"
                label="Milestone Description"
                value={milestone.description}
                onChange={e => updateMilestone(milestone.id, "description", e.target.value)}
                placeholder="Describe the specific goals and deliverables for this milestone"
                minRows={3}
              />
            </div>
            {index < milestones.length - 1 && <EdgeLine className="mt-6" />}
          </div>
        ))}

        <div className="flex justify-end">
          {milestones.length < maxMilestoneCount && (
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


      </div>
    </CornerFrame>
  );
};

export default MilestoneSection; 