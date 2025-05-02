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
        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--neon-green)' }}></div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--neon-green)' }}>
          {title}
        </h2>
      </div>
      <div className="px-2 py-1 text-xs rounded" style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.3)', 
        border: '1px solid var(--electric-blue)',
        color: 'var(--electric-blue)'
      }}>
        {statusText}
      </div>
    </div>
  );
}