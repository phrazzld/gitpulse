/**
 * Type definitions for AI-generated summaries
 */

/**
 * Technical area with a count of occurrences
 */
export interface TechnicalArea {
  name: string;
  count: number;
}

/**
 * Commit type categorization with a count
 */
export interface CommitType {
  type: string;
  count: number;
  description?: string;
}

/**
 * Highlight of a significant event in the timeline
 */
export interface Highlight {
  date: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

/**
 * Complete AI summary of activity
 */
export interface AISummary {
  /**
   * Identified key themes or topics
   */
  keyThemes: string[];
  
  /**
   * Technical areas of focus with occurrence counts
   */
  technicalAreas: TechnicalArea[];
  
  /**
   * Categorization of commits by type
   */
  commitsByType?: CommitType[];
  
  /**
   * Significant events in the timeline
   */
  timelineHighlights?: Highlight[];
  
  /**
   * Text summary of the overall activity
   */
  overallSummary: string;
}