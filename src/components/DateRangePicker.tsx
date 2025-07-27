import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export type DateRange = {
  since: string; // YYYY-MM-DD format
  until: string; // YYYY-MM-DD format
};

export interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (newDateRange: DateRange) => void;
  disabled?: boolean;
}

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Debounce delay for date changes (in milliseconds)
const DATE_DEBOUNCE_DELAY = 300;

export default function DateRangePicker({
  dateRange,
  onChange,
  disabled = false
}: DateRangePickerProps) {
  // Internal state for immediate UI feedback
  const [internalDateRange, setInternalDateRange] = useState<DateRange>(dateRange);
  
  // Update internal state when props change
  useEffect(() => {
    setInternalDateRange(dateRange);
  }, [dateRange]);
  
  // Create debounced onChange handler (300ms delay)
  const { callback: debouncedOnChange, pending: isDebouncing } = useDebounceCallback(
    onChange,
    DATE_DEBOUNCE_DELAY
  );
  
  // Calculate common preset date ranges
  const presets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Last 7 days
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    
    // Last 30 days
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    
    // First day of current month
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // First day of previous month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Last day of previous month
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    return {
      last7Days: {
        since: formatDate(last7Days),
        until: formatDate(today)
      },
      last30Days: {
        since: formatDate(last30Days),
        until: formatDate(today)
      },
      thisMonth: {
        since: formatDate(thisMonth),
        until: formatDate(today)
      },
      lastMonth: {
        since: formatDate(lastMonthStart),
        until: formatDate(lastMonthEnd)
      }
    };
  }, []);
  
  // Apply preset date range
  const applyPreset = useCallback((preset: keyof typeof presets) => {
    if (!disabled) {
      const newRange = presets[preset];
      // Update internal state immediately
      setInternalDateRange(newRange);
      // Trigger the debounced change
      debouncedOnChange(newRange);
    }
  }, [disabled, presets, debouncedOnChange]);
  
  // Handle manual date changes
  const handleDateChange = useCallback((field: keyof DateRange, value: string) => {
    if (!disabled) {
      const newRange = {
        ...internalDateRange,
        [field]: value
      };
      // Update internal state immediately
      setInternalDateRange(newRange);
      // Trigger the debounced change
      debouncedOnChange(newRange);
    }
  }, [internalDateRange, disabled, debouncedOnChange]);
  
  // Check if a preset is currently active
  const isPresetActive = useCallback((preset: DateRange): boolean => {
    return internalDateRange.since === preset.since && internalDateRange.until === preset.until;
  }, [internalDateRange]);

  return (
    <Card className="backdrop-blur-sm">
      <CardHeader className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
            <h3 className="text-sm font-medium uppercase">
              DATE RANGE
            </h3>
          </div>
          
          {/* Loading indicator for debounce */}
          {isDebouncing && (
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></span>
              <span className="text-xs text-primary">UPDATING</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Preset buttons */}
        <div className="mb-4">
          <div className="text-xs mb-2 text-muted-foreground">
            QUICK SELECT
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'last7Days', label: 'LAST 7 DAYS' },
              { id: 'last30Days', label: 'LAST 30 DAYS' },
              { id: 'thisMonth', label: 'THIS MONTH' },
              { id: 'lastMonth', label: 'LAST MONTH' }
            ].map(preset => (
              <Button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id as keyof typeof presets)}
                disabled={disabled || isDebouncing}
                variant={isPresetActive(presets[preset.id as keyof typeof presets]) ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Manual date inputs */}
        <div>
          <div className="text-xs mb-2 text-muted-foreground">
            CUSTOM RANGE
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="since" className="block text-xs mb-1">
                START DATE
              </Label>
              <div className="relative">
                <div className={`absolute left-0 top-0 h-full w-1 transition-colors bg-primary`}></div>
                <Input
                  type="date"
                  id="since"
                  value={internalDateRange.since}
                  onChange={(e) => handleDateChange('since', e.target.value)}
                  disabled={disabled}
                  className={`pl-3 ${isDebouncing ? 'border-primary' : ''}`}
                  required
                  max={internalDateRange.until}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="until" className="block text-xs mb-1">
                END DATE
              </Label>
              <div className="relative">
                <div className={`absolute left-0 top-0 h-full w-1 transition-colors bg-primary`}></div>
                <Input
                  type="date"
                  id="until"
                  value={internalDateRange.until}
                  onChange={(e) => handleDateChange('until', e.target.value)}
                  disabled={disabled}
                  className={`pl-3 ${isDebouncing ? 'border-primary' : ''}`}
                  required
                  min={internalDateRange.since}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}