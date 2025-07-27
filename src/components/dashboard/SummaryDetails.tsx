import React from 'react';
import { AISummary } from '@/types/dashboard';
import { Badge } from '@/components/ui/badge';

export interface SummaryDetailsProps {
  /**
   * AI summary data to display
   */
  aiSummary: AISummary;
}

/**
 * Displays detailed AI-generated analysis of GitHub activity
 */
const SummaryDetails: React.FC<SummaryDetailsProps> = ({ 
  aiSummary
}) => {
  return (
    <div>
      {/* Key Themes */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            IDENTIFIED PATTERNS
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {aiSummary.keyThemes.map((theme, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-foreground border-muted bg-muted/10"
            >
              {theme}
            </Badge>
          ))}
        </div>
      </div>

      {/* Technical Areas */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            TECHNICAL FOCUS AREAS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSummary.technicalAreas.map((area, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 rounded-md bg-black/30 border border-muted"
            >
              <span className="text-foreground">{area.name}</span>
              <Badge variant="secondary" className="text-xs">
                {area.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Accomplishments */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            KEY ACHIEVEMENTS
          </h3>
        </div>
        <div className="border rounded-md p-4 bg-black/20 border-muted">
          <ul className="space-y-3 text-foreground">
            {aiSummary.accomplishments.map((accomplishment, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-5 flex-shrink-0 mr-2 text-foreground">→</span>
                <span>{accomplishment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Commit Types */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            COMMIT CLASSIFICATION
          </h3>
        </div>
        <div className="space-y-4">
          {aiSummary.commitsByType.map((type, index) => (
            <div key={index} className="border-l-2 pl-4 py-1 border-muted">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-foreground">
                  {type.type}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {type.count}
                </Badge>
              </div>
              <p className="text-sm mt-1 text-white/70">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            TEMPORAL ANALYSIS
          </h3>
        </div>
        <div className="space-y-4">
          {aiSummary.timelineHighlights.map((highlight, index) => (
            <div key={index} className="flex border-b pb-3 border-muted/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-primary/10 border border-primary text-primary">
                {index + 1}
              </div>
              <div>
                <div className="text-xs font-mono mb-1 text-primary">
                  {new Date(highlight.date).toLocaleDateString()}
                </div>
                <div className="text-foreground">
                  {highlight.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Summary */}
      <div>
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm uppercase text-primary">
            COMPREHENSIVE ANALYSIS
          </h3>
        </div>
        <div className="p-4 rounded-md border bg-black/30 border-muted text-foreground">
          <div className="text-xs mb-2 font-mono text-foreground">
            $ AI_ANALYSIS --detailed-output
          </div>
          {aiSummary.overallSummary}
        </div>
      </div>
    </div>
  );
};

export default SummaryDetails;