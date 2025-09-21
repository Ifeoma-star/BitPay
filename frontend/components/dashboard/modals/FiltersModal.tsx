"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface FilterOptions {
  status: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  amountRange: {
    min: string;
    max: string;
  };
  recipients: string[];
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

export function FiltersModal({ isOpen, onClose, filters, onApplyFilters }: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [datePickerOpen, setDatePickerOpen] = useState<'from' | 'to' | null>(null);

  const statusOptions = [
    { value: "active", label: "Active", color: "bg-brand-teal" },
    { value: "completed", label: "Completed", color: "bg-green-500" },
    { value: "paused", label: "Paused", color: "bg-yellow-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  ];

  const handleStatusToggle = (status: string, checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }));
  };

  const handleDateChange = (date: Date | undefined, type: 'from' | 'to') => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: date
      }
    }));
    setDatePickerOpen(null);
  };

  const handleAmountChange = (value: string, type: 'min' | 'max') => {
    setLocalFilters(prev => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [type]: value
      }
    }));
  };

  const addRecipientFilter = (recipient: string) => {
    if (recipient.trim() && !localFilters.recipients.includes(recipient.trim())) {
      setLocalFilters(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipient.trim()]
      }));
    }
  };

  const removeRecipientFilter = (recipient: string) => {
    setLocalFilters(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const resetFilters = () => {
    setLocalFilters({
      status: [],
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: "", max: "" },
      recipients: []
    });
  };

  const applyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const hasActiveFilters = 
    localFilters.status.length > 0 ||
    localFilters.dateRange.from ||
    localFilters.dateRange.to ||
    localFilters.amountRange.min ||
    localFilters.amountRange.max ||
    localFilters.recipients.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand-pink" />
            Filter Streams
          </DialogTitle>
          <DialogDescription>
            Apply filters to find specific streams
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={localFilters.status.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleStatusToggle(option.value, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={option.value}
                    className="text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Popover open={datePickerOpen === 'from'} onOpenChange={(open) => setDatePickerOpen(open ? 'from' : null)}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.from ? (
                        format(localFilters.dateRange.from, "MMM dd, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.from}
                      onSelect={(date) => handleDateChange(date, 'from')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover open={datePickerOpen === 'to'} onOpenChange={(open) => setDatePickerOpen(open ? 'to' : null)}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateRange.to ? (
                        format(localFilters.dateRange.to, "MMM dd, yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.to}
                      onSelect={(date) => handleDateChange(date, 'to')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Amount Range (sBTC)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={localFilters.amountRange.min}
                  onChange={(e) => handleAmountChange(e.target.value, 'min')}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={localFilters.amountRange.max}
                  onChange={(e) => handleAmountChange(e.target.value, 'max')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Recipient Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Recipients</Label>
            <div className="space-y-2">
              <Input
                placeholder="Enter wallet address or name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addRecipientFilter(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              {localFilters.recipients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {localFilters.recipients.map((recipient, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="flex items-center gap-1"
                    >
                      {recipient.length > 20 ? `${recipient.slice(0, 8)}...${recipient.slice(-8)}` : recipient}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipientFilter(recipient)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-brand-pink/10 rounded-lg border border-brand-pink/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-brand-pink">Active Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {localFilters.status.length > 0 && `${localFilters.status.length} status(es), `}
                {(localFilters.dateRange.from || localFilters.dateRange.to) && "date range, "}
                {(localFilters.amountRange.min || localFilters.amountRange.max) && "amount range, "}
                {localFilters.recipients.length > 0 && `${localFilters.recipients.length} recipient(s)`}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}