import React from 'react';
import Image from 'next/image';
import { ActivityCommit } from '@/components/ActivityFeed';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface CommitItemProps {
  commit: ActivityCommit;
  showRepository: boolean;
  showContributor: boolean;
  style?: React.CSSProperties;
  isNew?: boolean;
}

/**
 * Component to render an individual commit item in the activity feed
 */
const CommitItem = React.memo(({
  commit,
  showRepository,
  showContributor,
  style,
  isNew = false
}: CommitItemProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract first line of commit message for the title
  const commitTitle = commit.commit.message.split('\n')[0];

  return (
    <div 
      className="pl-14 relative"
      style={style}
    >
      {/* Timeline dot */}
      <div className="absolute left-4 top-3 w-3 h-3 rounded-full border-2 bg-background border-primary z-10"></div>
      
      {/* Vertical timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-primary/40"></div>
      
      {/* Commit card with simplified design */}
      <Card className="p-3 mb-3">
        {/* Commit header with author and date */}
        <div className="flex justify-between items-start mb-2 flex-wrap">
          <div className="flex items-center mr-2">
            {showContributor && commit.contributor && (
              <div className="flex items-center">
                {commit.contributor.avatarUrl ? (
                  <Image 
                    src={commit.contributor.avatarUrl}
                    alt={commit.contributor.displayName}
                    width={20}
                    height={20}
                    className="rounded-full mr-2"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                    {commit.contributor.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-sm truncate max-w-48 text-primary">
                  {commit.contributor.displayName}
                </span>
              </div>
            )}
            
            {!showContributor && (
              <div className="flex items-center">
                <span className="font-bold text-sm truncate max-w-48 text-primary">
                  {commit.commit.author.name}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-foreground/70">
            {formatDate(commit.commit.author.date)}
          </div>
        </div>
        
        {/* Repository info if needed - condensed */}
        {showRepository && commit.repository && (
          <div className="mb-2">
            <a 
              href={commit.repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="text-xs hover:bg-accent">
                <Circle className="h-2.5 w-2.5 mr-1" />
                {commit.repository.full_name}
              </Badge>
            </a>
          </div>
        )}
        
        {/* Commit message */}
        <div className="text-sm text-foreground">
          <a 
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-inherit no-underline"
          >
            {commitTitle}
          </a>
        </div>
      </Card>
    </div>
  );
});

CommitItem.displayName = 'CommitItem';

export default CommitItem;