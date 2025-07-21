import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

type GroupedResult = {
  groupKey: string;
  groupName: string;
  groupAvatar?: string;
  commitCount: number;
  repositories: string[];
  dates: string[];
  commits: any[];
  aiSummary?: any;
};

type GroupedResultsViewProps = {
  groupedResults: GroupedResult[];
  groupBy: 'contributor' | 'organization' | 'repository' | 'chronological';
  expanded: Record<string, boolean>;
  onToggleExpand: (groupKey: string) => void;
};

export default function GroupedResultsView({
  groupedResults,
  groupBy,
  expanded,
  onToggleExpand
}: GroupedResultsViewProps) {
  if (!groupedResults || groupedResults.length === 0) {
    return (
      <div className="text-center p-6 text-foreground">
        No results to display.
      </div>
    );
  }

  // For chronological view, just show a message since the regular summary is displayed elsewhere
  if (groupBy === 'chronological') {
    return (
      <div className="text-center p-4 text-foreground">
        <Badge variant="outline" className="text-blue-500 border-blue-500 bg-black/30">
          Using chronological view - see overall summary below
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm uppercase mb-3 text-green-500">
        GROUPED ANALYSIS RESULTS
      </h3>
      
      <div className="grid grid-cols-1 gap-6">
        {groupedResults.map((group) => (
          <Card
            key={group.groupKey}
            className="overflow-hidden bg-slate-900/70 backdrop-blur-sm border-blue-500 shadow-lg shadow-blue-500/10"
          >
            {/* Group Header */}
            <CardHeader className={`flex flex-row items-center justify-between p-4 ${expanded[group.groupKey] ? 'border-b border-blue-500' : ''}`}>
              <div className="flex items-center">
                {group.groupAvatar && (
                  <Image 
                    src={group.groupAvatar}
                    alt={group.groupName}
                    width={32}
                    height={32}
                    className="rounded-full mr-3"
                  />
                )}
                <div>
                  <h4 className="font-bold text-green-500">
                    {group.groupName}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500 bg-green-500/10">
                      {group.commitCount} commits
                    </Badge>
                    <Badge variant="outline" className="text-xs text-blue-500 border-blue-500 bg-blue-500/10">
                      {group.repositories.length} repositories
                    </Badge>
                    <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500 bg-yellow-500/10">
                      {group.dates.length} days active
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => onToggleExpand(group.groupKey)}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${expanded[group.groupKey] ? 'rotate-180' : ''}`} />
              </Button>
            </CardHeader>
            
            {/* Expanded Content */}
            {expanded[group.groupKey] && (
              <CardContent className="p-4">
                {/* Repository List */}
                <div className="mb-6">
                  <h5 className="text-xs uppercase mb-2 text-blue-500">
                    REPOSITORIES ({group.repositories.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {group.repositories.map(repo => (
                      <Badge
                        key={repo}
                        variant="outline"
                        className="text-xs text-foreground border-blue-500 bg-black/30"
                      >
                        {repo}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* AI Summary if available */}
                {group.aiSummary ? (
                  <>
                    <h5 className="text-xs uppercase mb-2 text-blue-500">
                      AI ANALYSIS
                    </h5>
                    
                    {/* Key Themes */}
                    {group.aiSummary.keyThemes.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-bold mb-1 text-green-500">
                          KEY THEMES
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.aiSummary.keyThemes.map((theme: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs text-green-500 border-green-500 bg-green-500/10"
                            >
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Technical Areas */}
                    {group.aiSummary.technicalAreas.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-bold mb-1 text-green-500">
                          TECHNICAL FOCUS
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.aiSummary.technicalAreas.slice(0, 5).map((area: any, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs text-blue-500 border-blue-500 bg-blue-500/10 flex items-center gap-1"
                            >
                              {area.name}
                              <span className="ml-1 px-1 rounded bg-black/30">
                                {area.count}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary */}
                    <div className="mb-4">
                      <div className="text-xs font-bold mb-1 text-green-500">
                        SUMMARY
                      </div>
                      <div className="text-sm text-foreground">
                        {group.aiSummary.overallSummary}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-foreground">
                    No AI summary available for this group.
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}