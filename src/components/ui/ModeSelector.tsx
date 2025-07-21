import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * Activity mode options for data display filtering
 */
export type ActivityMode = 'my-activity' | 'my-work-activity' | 'team-activity';

/**
 * Configuration for a mode option
 */
export interface ModeOption {
  /**
   * Unique identifier for the mode
   */
  id: ActivityMode;
  
  /**
   * Display label for the mode
   */
  label: string;
  
  /**
   * Descriptive text explaining the mode
   */
  description: string;
}

/**
 * Default mode options available in the application
 */
export const DEFAULT_MODES: ModeOption[] = [
  { 
    id: 'my-activity', 
    label: 'My Activity', 
    description: 'View your commits across all repositories'
  },
  { 
    id: 'my-work-activity', 
    label: 'My Work Activity', 
    description: 'View your commits within selected organizations'
  },
  { 
    id: 'team-activity', 
    label: 'Team Activity', 
    description: 'View all team members\' activity within selected organizations'
  },
];

/**
 * Props for the ModeSelector component
 */
export interface ModeSelectorProps {
  /**
   * Currently selected mode
   */
  selectedMode: ActivityMode;
  
  /**
   * Callback fired when mode changes
   * @param mode The newly selected mode
   */
  onChange: (mode: ActivityMode) => void;
  
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Available modes to display
   * @default DEFAULT_MODES
   */
  modes?: ModeOption[];
  
  /**
   * Accessibility label for the radio group
   * @default 'Activity Mode'
   */
  ariaLabel?: string;
  
  /**
   * CSS class to apply to the root element
   */
  className?: string;
  
  /**
   * Primary color for accents (selected items, indicators)
   * @deprecated Use className instead
   */
  accentColor?: string;
  
  /**
   * Text color for descriptions
   * @deprecated Use className instead
   */
  secondaryColor?: string;
  
  /**
   * Main text color
   * @deprecated Use className instead
   */
  textColor?: string;
  
  /**
   * Background color for the container
   * @deprecated Use className instead
   */
  backgroundColor?: string;
  
  /**
   * Background color for selected items
   * @deprecated Use className instead
   */
  selectedBackgroundColor?: string;
}

/**
 * ModeSelector component displays a radio group to select between different 
 * activity modes (personal, work, team).
 * 
 * Accessibility features:
 * - Uses shadcn RadioGroup with built-in ARIA support
 * - Supports keyboard navigation with arrow keys and tab
 * - Provides descriptive labels for all interactive elements
 * 
 * @example
 * ```tsx
 * <ModeSelector 
 *   selectedMode="my-activity" 
 *   onChange={handleModeChange} 
 * />
 * ```
 */
export default function ModeSelector({ 
  selectedMode,
  onChange,
  disabled = false,
  modes = DEFAULT_MODES,
  ariaLabel = 'Activity Mode',
  className = '',
  accentColor,
  secondaryColor,
  textColor,
  backgroundColor,
  selectedBackgroundColor,
}: ModeSelectorProps) {
  return (
    <div className={`rounded-lg border bg-card ${className}`}>
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium">
          {ariaLabel}
        </h3>
      </div>

      <div className="p-4">
        <RadioGroup
          value={selectedMode}
          onValueChange={(value) => onChange(value as ActivityMode)}
          disabled={disabled}
          className="space-y-3"
        >
          {modes.map((mode) => (
            <div 
              key={mode.id}
              className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem 
                value={mode.id} 
                id={mode.id}
                className="mt-0.5"
              />
              <Label 
                htmlFor={mode.id}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium">
                  {mode.label}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {mode.description}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}