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
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            IDENTIFIED PATTERNS
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {aiSummary.keyThemes.map((theme, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-green-500 border-green-500 bg-green-500/10"
            >
              {theme}
            </Badge>
          ))}
        </div>
      </div>

      {/* Technical Areas */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            TECHNICAL FOCUS AREAS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSummary.technicalAreas.map((area, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 rounded-md bg-black/30 border border-blue-500"
            >
              <span className="text-foreground">{area.name}</span>
              <Badge variant="secondary" className="text-xs text-blue-500 bg-blue-500/20">
                {area.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Accomplishments */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            KEY ACHIEVEMENTS
          </h3>
        </div>
        <div className="border rounded-md p-4 bg-black/20 border-green-500">
          <ul className="space-y-3 text-foreground">
            {aiSummary.accomplishments.map((accomplishment, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-5 flex-shrink-0 mr-2 text-green-500">→</span>
                <span>{accomplishment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Commit Types */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            COMMIT CLASSIFICATION
          </h3>
        </div>
        <div className="space-y-4">
          {aiSummary.commitsByType.map((type, index) => (
            <div key={index} className="border-l-2 pl-4 py-1 border-green-500">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-green-500">
                  {type.type}
                </h4>
                <Badge variant="outline" className="text-xs text-green-500 border-green-500 bg-green-500/10">
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
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            TEMPORAL ANALYSIS
          </h3>
        </div>
        <div className="space-y-4">
          {aiSummary.timelineHighlights.map((highlight, index) => (
            <div key={index} className="flex border-b pb-3 border-blue-500/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-blue-500/10 border border-blue-500 text-blue-500">
                {index + 1}
              </div>
              <div>
                <div className="text-xs font-mono mb-1 text-blue-500">
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
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            COMPREHENSIVE ANALYSIS
          </h3>
        </div>
        <div className="p-4 rounded-md border bg-black/30 border-green-500 text-foreground">
          <div className="text-xs mb-2 font-mono text-green-500">
            $ AI_ANALYSIS --detailed-output
          </div>
          {aiSummary.overallSummary}
        </div>
      </div>
    </div>
  );
};

export default SummaryDetails;