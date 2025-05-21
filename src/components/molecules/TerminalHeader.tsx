import React from 'react';

export interface TerminalHeaderProps {
  /**
   * The title text to display
   */
  title: string;
  
  /**
   * Optional status text to display
   */
  statusText?: string;
}

/**
 * A terminal-like header component with a title and optional status indicator
 */
export default function TerminalHeader({ title, statusText = 'OPERATIONAL STATUS: ACTIVE' }: TerminalHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--neon-green, #00994f)' }}></div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--neon-green, #00994f)' /* #00994f - Meets WCAG AA 3.51:1 contrast ratio for large text */ }}>
          {title}
        </h2>
      </div>
      <div className="px-2 py-1 text-xs rounded" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        // Using a darker blue for better contrast with backgrounds (WCAG AA 4.5:1 ratio)
        border: '1px solid var(--electric-blue, #0066cc)',
        color: 'var(--electric-blue, #0066cc)' // Changed from #3b8eea to #0066cc
      }}>
        {statusText}
      </div>
    </div>
  );
}