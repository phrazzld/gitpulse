import React from "react";

/**
 * Terminal-style header component for dashboard panels
 *
 * Displays a stylized header with a title and operational status,
 * resembling a terminal window header.
 */
export default function TerminalHeader() {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full mr-sm bg-neon-green"></div>
        <h2 className="text-xl font-bold text-neon-green">
          COMMIT ANALYSIS MODULE
        </h2>
      </div>
      <div className="px-sm py-xs text-xs rounded border border-electric-blue text-electric-blue bg-black/30">
        OPERATIONAL STATUS: ACTIVE
      </div>
    </div>
  );
}
