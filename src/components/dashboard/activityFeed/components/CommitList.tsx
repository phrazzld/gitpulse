import React from "react";
import { FixedSizeList as List } from "react-window";
import { ActivityCommit } from "@/types/activity";
import { CommitItem } from "./CommitItem";

interface CommitListProps {
  commits: ActivityCommit[];
  listWidth: number;
  listHeight: number;
  itemHeight: number;
  itemCount: number;
  showRepository: boolean;
  newItemsCount: number;
}

/**
 * CommitList Component
 *
 * Displays a virtualized list of commits
 */
export function CommitList({
  commits,
  listWidth,
  listHeight,
  itemHeight,
  itemCount,
  showRepository,
  newItemsCount,
}: CommitListProps) {
  return (
    <List
      height={listHeight}
      width={listWidth}
      itemCount={itemCount}
      itemSize={itemHeight}
      overscanCount={3}
      className="scrollbar-custom"
    >
      {({ index, style }) => (
        <CommitItem
          key={commits[index].sha}
          commit={commits[index]}
          showRepository={showRepository}
          style={style}
          isNew={index >= commits.length - newItemsCount}
        />
      )}
    </List>
  );
}
