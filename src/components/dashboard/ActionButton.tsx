import React from "react";
import { useUIState } from "@/state";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight, Loader2 } from "lucide-react";

export default function ActionButton() {
  // Get loading state directly from Zustand store
  const { loading } = useUIState();

  return (
    <div className="flex justify-end pt-4">
      <Button
        type="submit"
        disabled={loading}
        title="Analyze your GitHub commits and generate activity summary with AI insights"
        size="lg"
        className="font-bold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ANALYZING DATA...
          </>
        ) : (
          <>
            <BarChart3 className="mr-2 h-4 w-4" />
            ANALYZE COMMITS
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
