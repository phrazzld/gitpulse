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
    label: 'MY ACTIVITY', 
    description: 'View your commits across all repositories'
  },
  { 
    id: 'my-work-activity', 
    label: 'MY WORK ACTIVITY', 
    description: 'View your commits within selected organizations'
  },
  { 
    id: 'team-activity', 
    label: 'TEAM ACTIVITY', 
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
   * @default 'var(--neon-green)'
   */
  accentColor?: string;
  
  /**
   * Text color for descriptions
   * @default 'var(--electric-blue)'
   */
  secondaryColor?: string;
  
  /**
   * Main text color
   * @default 'var(--foreground)'
   */
  textColor?: string;
  
  /**
   * Background color for the container
   * @default 'rgba(27, 43, 52, 0.7)'
   */
  backgroundColor?: string;
  
  /**
   * Background color for selected items
   * @default 'rgba(0, 255, 135, 0.1)'
   */
  selectedBackgroundColor?: string;
}

/**
 * ModeSelector component displays a radio group to select between different 
 * activity modes (personal, work, team).
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
  accentColor = 'var(--neon-green)',
  secondaryColor = 'var(--electric-blue)',
  textColor = 'var(--foreground)',
  backgroundColor = 'rgba(27, 43, 52, 0.7)',
  selectedBackgroundColor = 'rgba(0, 255, 135, 0.1)',
}: ModeSelectorProps) {
  // Handle mode change
  const handleModeChange = (mode: ActivityMode) => {
    if (!disabled) {
      onChange(mode);
    }
  };

  // Generate a unique ID for ARIA labelling
  const headerId = `mode-selector-heading-${Math.floor(Math.random() * 10000)}`;

  return (
    <div 
      className={`rounded-lg border ${className}`} 
      style={{ 
        backgroundColor: backgroundColor,
        backdropFilter: 'blur(5px)',
        borderColor: accentColor,
      }}
      role="radiogroup"
      aria-labelledby={headerId}
    >
      <div className="p-3 border-b" style={{ borderColor: accentColor }}>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: accentColor }}></div>
          <h3 
            id={headerId}
            className="text-sm uppercase" 
            style={{ color: accentColor }}
          >
            {ariaLabel}
          </h3>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {modes.map((mode) => (
            <div 
              key={mode.id}
              className={`p-3 rounded-md transition-all duration-200 cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ 
                backgroundColor: selectedMode === mode.id 
                  ? selectedBackgroundColor 
                  : 'rgba(27, 43, 52, 0.5)',
                borderLeft: `3px solid ${selectedMode === mode.id ? accentColor : 'transparent'}`,
              }}
              onClick={() => handleModeChange(mode.id)}
              role="radio"
              aria-checked={selectedMode === mode.id}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModeChange(mode.id);
                }
              }}
              aria-label={`${mode.label}: ${mode.description}`}
            >
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center"
                  style={{ 
                    borderColor: accentColor,
                  }}
                >
                  {selectedMode === mode.id && (
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: textColor }}>
                    {mode.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: secondaryColor }}>
                    {mode.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}