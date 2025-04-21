import React from "react";
import { ActivityCommit } from "@/types/activity";
import {
  extractCommitTitle,
  formatCommitDate,
} from "../utils/activityFeedUtils";

interface CommitItemProps {
  commit: ActivityCommit;
  showRepository: boolean;
  style?: React.CSSProperties;
  isNew?: boolean;
}

/**
 * CommitItem Component
 *
 * Renders an individual commit in the activity feed.
 */
export const CommitItem = React.memo(
  ({ commit, showRepository, style, isNew = false }: CommitItemProps) => {
    // Extract first line of commit message for the title
    const commitTitle = extractCommitTitle(commit.commit.message);

    return (
      <div
        className={`pl-12 relative ${isNew ? "animate-fadeIn" : ""}`}
        style={{
          ...style,
          paddingLeft: "3.5rem",
        }}
      >
        {/* Timeline dot */}
        <div
          className="absolute left-4 top-3 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: "var(--dark-slate)",
            borderColor: isNew ? "var(--neon-green)" : "var(--electric-blue)",
            zIndex: 1,
          }}
        ></div>

        {/* Vertical timeline line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{
            backgroundColor: "var(--electric-blue)",
            opacity: 0.4,
          }}
        ></div>

        {/* Commit card */}
        <div
          className={`border rounded-md p-3 mb-3 ${isNew ? "animate-pulse-highlight" : ""}`}
          style={{
            backgroundColor: "rgba(27, 43, 52, 0.7)",
            backdropFilter: "blur(5px)",
            borderColor: isNew ? "var(--neon-green)" : "var(--electric-blue)",
            boxShadow: isNew
              ? "0 0 15px rgba(0, 255, 135, 0.2)"
              : "0 0 10px rgba(59, 142, 234, 0.1)",
          }}
        >
          {/* Commit header with author and date */}
          <div className="flex justify-between items-start mb-2 flex-wrap">
            <div className="flex items-center mr-2">
              <div className="flex items-center">
                <span
                  className="font-bold text-sm truncate max-w-48"
                  style={{ color: "var(--electric-blue)" }}
                >
                  {commit.commit.author.name}
                </span>
              </div>
            </div>

            <div
              className="text-xs"
              style={{ color: "var(--foreground)", opacity: 0.7 }}
            >
              {formatCommitDate(commit.commit.author.date)}
            </div>
          </div>

          {/* Repository info if needed */}
          {showRepository && commit.repository && (
            <div className="mb-2">
              <a
                href={commit.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-1.5 py-0.5 rounded inline-flex items-center"
                style={{
                  backgroundColor: "rgba(0, 255, 135, 0.1)",
                  color: "var(--neon-green)",
                  border: "1px solid var(--neon-green)",
                  textDecoration: "none",
                }}
              >
                <svg
                  className="h-2.5 w-2.5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
                    clipRule="evenodd"
                  />
                </svg>
                {commit.repository.full_name}
              </a>
            </div>
          )}

          {/* Commit message */}
          <div className="text-sm" style={{ color: "var(--foreground)" }}>
            <a
              href={commit.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="hover:underline"
            >
              {commitTitle}
            </a>
          </div>
        </div>
      </div>
    );
  },
);
