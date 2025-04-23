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
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary"></div>
        <h2 className="text-xl font-bold text-primary">
          COMMIT ANALYSIS MODULE
        </h2>
      </div>
      <div className="px-2 py-1 text-xs rounded border border-secondary text-secondary bg-muted">
        OPERATIONAL STATUS: ACTIVE
      </div>
    </div>
  );
}
