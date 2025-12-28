import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

interface AvailabilityPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  // Parse the value - format: "Mon,Tue,Wed|Morning,Afternoon|10"
  const parts = value.split("|");
  const selectedDays = parts[0] ? parts[0].split(",").filter(Boolean) : [];
  const selectedTimes = parts[1] ? parts[1].split(",").filter(Boolean) : [];
  const hoursPerWeek = parts[2] ? parseInt(parts[2]) : 5;

  const updateValue = (days: string[], times: string[], hours: number) => {
    onChange(`${days.join(",")}|${times.join(",")}|${hours}`);
  };

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    updateValue(newDays, selectedTimes, hoursPerWeek);
  };

  const toggleTime = (time: string) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter((t) => t !== time)
      : [...selectedTimes, time];
    updateValue(selectedDays, newTimes, hoursPerWeek);
  };

  const setHours = (hours: number[]) => {
    updateValue(selectedDays, selectedTimes, hours[0]);
  };

  return (
    <div className="space-y-6">
      {/* Days selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Available Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <Badge
              key={day}
              variant={selectedDays.includes(day) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5",
                selectedDays.includes(day) 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => toggleDay(day)}
            >
              {day}
            </Badge>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preferred Times</Label>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((time) => (
            <Badge
              key={time}
              variant={selectedTimes.includes(time) ? "secondary" : "outline"}
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5",
                selectedTimes.includes(time) 
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => toggleTime(time)}
            >
              {time}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hours per week */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Hours per Week</Label>
          <span className="text-sm font-semibold text-primary">{hoursPerWeek} hrs</span>
        </div>
        <Slider
          value={[hoursPerWeek]}
          onValueChange={setHours}
          min={1}
          max={40}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 hr</span>
          <span>20 hrs</span>
          <span>40 hrs</span>
        </div>
      </div>

      {/* Summary */}
      {(selectedDays.length > 0 || selectedTimes.length > 0) && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your availability: </span>
            {selectedDays.length > 0 && selectedDays.join(", ")}
            {selectedDays.length > 0 && selectedTimes.length > 0 && " • "}
            {selectedTimes.length > 0 && selectedTimes.join(", ")}
            {(selectedDays.length > 0 || selectedTimes.length > 0) && ` • ${hoursPerWeek} hrs/week`}
          </p>
        </div>
      )}
    </div>
  );
}
