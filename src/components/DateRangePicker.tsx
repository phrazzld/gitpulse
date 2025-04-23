import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { dateRangeSchema, validateSchema } from "@/lib/validation";

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
  return date.toISOString().split("T")[0];
};

// Debounce delay for date changes (in milliseconds)
const DATE_DEBOUNCE_DELAY = 300;

export default function DateRangePicker({
  dateRange,
  onChange,
  disabled = false,
}: DateRangePickerProps) {
  // Create a safe default if dateRange is undefined
  const safeDateRange: DateRange = dateRange || {
    since: "",
    until: "",
  };

  // Internal state for immediate UI feedback
  const [internalDateRange, setInternalDateRange] =
    useState<DateRange>(safeDateRange);
  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update internal state when props change
  useEffect(() => {
    setInternalDateRange(safeDateRange);
    setValidationError(null);
  }, [safeDateRange]);

  // Create debounced onChange handler (300ms delay)
  const { callback: debouncedOnChange, pending: isDebouncing } =
    useDebounceCallback<(newDateRange: DateRange) => void, DateRange>(
      onChange,
      DATE_DEBOUNCE_DELAY,
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
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );

    // Last day of previous month
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
      last7Days: {
        since: formatDate(last7Days),
        until: formatDate(today),
      },
      last30Days: {
        since: formatDate(last30Days),
        until: formatDate(today),
      },
      thisMonth: {
        since: formatDate(thisMonth),
        until: formatDate(today),
      },
      lastMonth: {
        since: formatDate(lastMonthStart),
        until: formatDate(lastMonthEnd),
      },
    };
  }, []);

  // Validate the date range
  const validateDateRange = useCallback((range: DateRange): boolean => {
    const validation = validateSchema(dateRangeSchema, range);
    if (!validation.success) {
      setValidationError(validation.error || "Invalid date range");
      return false;
    }
    setValidationError(null);
    return true;
  }, []);

  // Apply preset date range
  const applyPreset = useCallback(
    (preset: keyof typeof presets) => {
      if (!disabled) {
        const newRange = presets[preset];
        // Update internal state immediately
        setInternalDateRange(newRange);
        // Validate before applying
        if (validateDateRange(newRange)) {
          // Trigger the debounced change
          debouncedOnChange(newRange);
        }
      }
    },
    [disabled, presets, debouncedOnChange, validateDateRange],
  );

  // Handle manual date changes
  const handleDateChange = useCallback(
    (field: keyof DateRange, value: string) => {
      if (!disabled) {
        const newRange = {
          ...internalDateRange,
          [field]: value,
        };
        // Update internal state immediately
        setInternalDateRange(newRange);
        // Validate before applying
        if (validateDateRange(newRange)) {
          // Trigger the debounced change
          debouncedOnChange(newRange);
        }
      }
    },
    [internalDateRange, disabled, debouncedOnChange, validateDateRange],
  );

  // Check if a preset is currently active
  const isPresetActive = useCallback(
    (preset: DateRange): boolean => {
      return (
        internalDateRange.since === preset.since &&
        internalDateRange.until === preset.until
      );
    },
    [internalDateRange],
  );

  return (
    <div>
      <div>
        <div>
          <div>
            <div></div>
            <h3>DATE RANGE</h3>
          </div>

          {/* Loading indicator for debounce */}
          {isDebouncing && (
            <div>
              <span></span>
              <span>UPDATING</span>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Validation error message */}
        {validationError && (
          <div>
            <div>
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Preset buttons */}
        <div>
          <div>QUICK SELECT</div>
          <div>
            {[
              { id: "last7Days", label: "LAST 7 DAYS" },
              { id: "last30Days", label: "LAST 30 DAYS" },
              { id: "thisMonth", label: "THIS MONTH" },
              { id: "lastMonth", label: "LAST MONTH" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id as keyof typeof presets)}
                disabled={disabled || isDebouncing}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manual date inputs */}
        <div>
          <div>CUSTOM RANGE</div>
          <div>
            <div>
              <label htmlFor="since">START DATE</label>
              <div>
                <div></div>
                <input
                  type="date"
                  id="since"
                  value={internalDateRange.since}
                  onChange={(e) => handleDateChange("since", e.target.value)}
                  disabled={disabled}
                  required
                  max={internalDateRange.until}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? "date-error" : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="until">END DATE</label>
              <div>
                <div></div>
                <input
                  type="date"
                  id="until"
                  value={internalDateRange.until}
                  onChange={(e) => handleDateChange("until", e.target.value)}
                  disabled={disabled}
                  required
                  min={internalDateRange.since}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? "date-error" : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
