import React from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { ActivityMode } from "@/types/activity";
import { Session } from "next-auth";
import {
  useDateRange,
  useFilters,
  useUIState,
  useInstallations,
} from "@/state";

interface Props {
  activityMode: ActivityMode;
  session: Session | null;
}

export default function FilterControls({ activityMode, session }: Props) {
  // Get state directly from Zustand hooks
  const { loading: uiLoading } = useUIState();
  const { dateRange, updateDateRange } = useDateRange();
  const { filters: activeFilters } = useFilters();
  const { installations, loading: installationsLoading } = useInstallations();

  // Determine loading state
  const loading = uiLoading || installationsLoading;

  // Function to handle date range changes
  const handleDateRangeChange = (newDateRange: {
    since: string;
    until: string;
  }) => {
    updateDateRange(newDateRange.since, newDateRange.until);
  };

  return (
    <div>
      <div>
        <div>
          <div>
            <div></div>
            <h3>ANALYSIS FILTERS</h3>
          </div>
          <button>CONFIGURE PARAMETERS</button>
        </div>
      </div>

      <div>
        {/* Left column */}
        <div>
          {/* Activity mode info panel */}
          <div>
            <div>
              <div>
                <div></div>
                <h3>ACTIVITY MODE</h3>
              </div>
            </div>
            <div>
              <div>
                <div>
                  <div>
                    <div></div>
                  </div>
                  <div>
                    <div>MY ACTIVITY</div>
                    <div>View your commits across all repositories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Date and Analysis Info */}
        <div>
          <DateRangePicker
            dateRange={dateRange || { since: "", until: "" }}
            onChange={handleDateRangeChange}
            disabled={loading}
          />

          {/* Analysis Parameters Info Card */}
          <div>
            <div>
              <div></div>
              <h3>ANALYSIS PARAMETERS</h3>
            </div>

            <div>
              <div>
                <span>MODE</span>
                <span>MY ACTIVITY</span>
              </div>

              <div>
                <span>DATE RANGE</span>
                <span>
                  {dateRange?.since || ""} to {dateRange?.until || ""}
                </span>
              </div>

              <div>
                <div>
                  Configure your analysis parameters above, then click the
                  Analyze Commits button below to generate insights.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
