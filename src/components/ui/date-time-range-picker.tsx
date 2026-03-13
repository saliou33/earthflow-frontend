"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface DateTimeRangePickerProps {
  range?: { start: Date; end: Date };
  onChange?: (range: { start: Date; end: Date } | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimeRangePicker({
  range,
  onChange,
  placeholder = "Pick a date range",
  className,
}: DateTimeRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    range ? { from: range.start, to: range.end } : undefined
  );
  
  const [startTime, setStartTime] = React.useState<string>(
    range ? format(range.start, "HH:mm") : "00:00"
  );
  const [endTime, setEndTime] = React.useState<string>(
    range ? format(range.end, "HH:mm") : "23:59"
  );

  React.useEffect(() => {
    if (range) {
      setDateRange({ from: range.start, to: range.end });
      setStartTime(format(range.start, "HH:mm"));
      setEndTime(format(range.end, "HH:mm"));
    }
  }, [range]);

  const updateRange = (newDateRange: DateRange | undefined, startT: string, endT: string) => {
    if (!newDateRange?.from || !newDateRange?.to) {
        onChange?.(undefined);
        return;
    }

    const start = new Date(newDateRange.from);
    const [sH, sM] = startT.split(":").map(Number);
    start.setHours(sH);
    start.setMinutes(sM);

    const end = new Date(newDateRange.to);
    const [eH, eM] = endT.split(":").map(Number);
    end.setHours(eH);
    end.setMinutes(eM);

    onChange?.({ start, end });
  };

  const handleSelect = (d: DateRange | undefined) => {
    setDateRange(d);
    updateRange(d, startTime, endTime);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-8 overflow-hidden",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {range?.start ? (
            range.end ? (
              <span className="truncate">
                {format(range.start, "LLL dd, HH:mm")} -{" "}
                {format(range.end, "LLL dd, HH:mm")}
              </span>
            ) : (
              format(range.start, "LLL dd, HH:mm")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
        <div className="p-4 border-t bg-muted/20 space-y-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Start Time</span>
                </div>
                <Input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => {
                        setStartTime(e.target.value);
                        updateRange(dateRange, e.target.value, endTime);
                    }}
                    className="w-[100px] h-8 text-xs px-2"
                />
            </div>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>End Time</span>
                </div>
                <Input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => {
                        setEndTime(e.target.value);
                        updateRange(dateRange, startTime, e.target.value);
                    }}
                    className="w-[100px] h-8 text-xs px-2"
                />
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
