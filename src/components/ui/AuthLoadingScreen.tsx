'use client';

/**
 * Props for the AuthLoadingScreen component
 */
interface AuthLoadingScreenProps {
  /**
   * Primary message displayed as a title
   */
  message?: string;
  
  /**
   * Secondary message displayed below the status line
   */
  subMessage?: string;
  
  /**
   * Status line message displayed with animation
   */
  statusMessage?: string;
  
  /**
   * Footer message displayed at the bottom
   */
  footerMessage?: string;
  
  /**
   * Primary accent color (default: #00ff87 - neon green)
   */
  primaryColor?: string;
  
  /**
   * Secondary accent color (default: #3b8eea - electric blue)
   */
  secondaryColor?: string;
  
  /**
   * Text color (default: #ffffff - white)
   */
  textColor?: string;
  
  /**
   * Background for the entire screen (default: var(--gradient-bg) or fallback)
   */
  background?: string;
  
  /**
   * Card background color (default: rgba(27, 43, 52, 0.7) - dark slate with opacity)
   */
  cardBackground?: string;
  
  /**
   * Optional CSS class name to apply to the container
   */
  className?: string;
  
  /**
   * Disable animations and performance-intensive effects
   * Set to true to disable CSS animations and backdrop filters
   * Recommended for Storybook stories and testing environments
   * @default false
   */
  disableEffects?: boolean;
}

/**
 * A stylized loading screen for authentication transitions
 * 
 * Features a terminal-like interface with configurable colors and messages.
 * 
 * @example
 * ```tsx
 * <AuthLoadingScreen 
 *   message="Verifying Authentication"
 *   subMessage="Please wait while we verify your credentials"
 * />
 * ```
 */
export default function AuthLoadingScreen({
  message = 'Verifying Authentication',
  subMessage = 'Please wait while we verify your credentials',
  statusMessage = 'System access verification in progress...',
  footerMessage = 'SECURE CONNECTION ESTABLISHED',
  primaryColor = '#00ff87', // --neon-green
  secondaryColor = '#3b8eea', // --electric-blue  
  textColor = '#ffffff', // --foreground
  background = 'var(--gradient-bg, linear-gradient(135deg, #121212 0%, #1b2b34 100%))',
  cardBackground = 'rgba(27, 43, 52, 0.7)',
  className = '',
  disableEffects = false
}: AuthLoadingScreenProps) {
  // Effects are disabled based solely on the disableEffects prop

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${className}`} 
      style={{ background }}
    >
      <div 
        className="card w-full max-w-md p-8 space-y-8 border-2 rounded-md" 
        style={{ 
          backgroundColor: cardBackground,
          // Only apply backdrop-filter if effects are enabled
          ...(disableEffects ? {} : { backdropFilter: 'blur(10px)' }),
          boxShadow: `0 0 20px ${primaryColor}33`,
          borderColor: primaryColor
        }}
      >
        {/* Terminal-style header */}
        <div className="flex items-center mb-4">
          <div className="flex space-x-1 mr-3">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: i === 0 
                    ? primaryColor 
                    : i === 1 
                      ? secondaryColor 
                      : textColor
                }}
              />
            ))}
          </div>
          <div className="h-px flex-grow" style={{ backgroundColor: secondaryColor }}></div>
        </div>
        
        <h2 className="text-xl text-center" style={{ color: primaryColor }}>{message}</h2>
        
        <div 
          className="flex justify-center items-start space-x-4 p-4 border border-opacity-30 rounded-md" 
          style={{ 
            borderColor: secondaryColor,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ color: secondaryColor }}>
            <svg 
              className={disableEffects ? "h-8 w-8" : "animate-spin h-8 w-8"} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="space-y-2 flex-1">
            <p 
              className={disableEffects ? "text-sm" : "text-sm animate-pulse"} 
              style={{ color: secondaryColor }}
            >
              &gt; {statusMessage}
            </p>
            <p className="text-xs" style={{ color: textColor }}>
              &gt; {subMessage}
            </p>
            <div className="flex space-x-1 text-xs mt-2" style={{ color: textColor }}>
              <span>&gt;</span>
              <span className={disableEffects ? "" : "animate-pulse"}>|</span>
            </div>
          </div>
        </div>
        
        {footerMessage && (
          <div className="text-center text-xs" style={{ color: textColor }}>
            <p>{footerMessage}</p>
            <div className="flex justify-center items-center mt-2">
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
              <div className="px-2">•</div>
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}