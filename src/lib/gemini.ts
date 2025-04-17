import { GoogleGenerativeAI, GenerateContentResult, GenerationConfig } from "@google/generative-ai";
import { Commit } from "../types/github";
import { logger } from "./logger";
import { isGitHubTokenValid } from "./auth/tokenValidator";

const MODULE_NAME = "gemini";

/**
 * Interface representing the structure of a commit summary generated by the Gemini API.
 */
export interface CommitSummary {
  keyThemes: string[];
  technicalAreas: {
    name: string;
    count: number;
  }[];
  accomplishments: string[];
  commitsByType: {
    type: string;
    count: number;
    description: string;
  }[];
  timelineHighlights: {
    date: string;
    description: string;
  }[];
  overallSummary: string;
}

/**
 * Interface for simplified commit data sent to Gemini API.
 */
interface CommitDataForAnalysis {
  message: string;
  date: string;
  author: string;
  repository: string;
  url: string;
}

/**
 * Creates an empty commit summary for cases with no commits.
 * 
 * @returns An empty CommitSummary object
 */
function createEmptyCommitSummary(): CommitSummary {
  return {
    keyThemes: ["No commits found in the selected time period"],
    technicalAreas: [],
    accomplishments: ["No activity in the selected time period"],
    commitsByType: [],
    timelineHighlights: [],
    overallSummary: "No commits were found in the selected time period.",
  };
}

/**
 * Initializes the Gemini AI model for text generation.
 * 
 * @param apiKey The Gemini API key
 * @returns Initialized Gemini model
 */
function initializeGeminiModel(apiKey: string) {
  logger.debug(MODULE_NAME, "Initializing Gemini API");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig: GenerationConfig = {
    temperature: 0.5,
    responseMimeType: "application/json",
  };
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig,
  });
  
  logger.debug(MODULE_NAME, "Gemini API initialized", {
    modelName: "gemini-2.0-flash",
    temperature: generationConfig.temperature,
    responseMimeType: generationConfig.responseMimeType,
  });
  
  return model;
}

/**
 * Prepares commit data for analysis by Gemini.
 * 
 * @param commits Array of GitHub commits
 * @returns Simplified commit data array and debugging metadata
 */
function prepareCommitData(commits: Commit[]): {
  commitData: CommitDataForAnalysis[];
  debugMetadata: Record<string, unknown>;
} {
  logger.debug(MODULE_NAME, "Preparing commit data for analysis");
  
  const commitData = commits.map((commit) => ({
    message: commit.commit.message,
    date: commit.commit.author?.date || "unknown",
    author: commit.commit.author?.name || "unknown",
    repository: commit.repository?.full_name || "unknown",
    url: commit.html_url,
  }));
  
  // Extract metadata for debugging purposes
  const debugMetadata = {
    sampleCommit:
      commits.length > 0
        ? {
            message: commits[0].commit.message.substring(0, 100),
            date: commits[0].commit.author?.date || "unknown",
            repo: commits[0].repository?.full_name,
          }
        : null,
    uniqueRepos: Array.from(
      new Set(commits.map((c) => c.repository?.full_name)),
    ).length,
    uniqueAuthors: Array.from(
      new Set(commits.map((c) => c.commit.author?.name || "unknown")),
    ).length,
    dateRange:
      commits.length > 0
        ? {
            earliest: commits[commits.length - 1]?.commit?.author?.date
              ? new Date(
                  commits[commits.length - 1]?.commit?.author?.date as string,
                ).toISOString()
              : "unknown",
            latest: commits[0]?.commit?.author?.date
              ? new Date(
                  commits[0]?.commit?.author?.date as string,
                ).toISOString()
              : "unknown",
          }
        : null,
  };
  
  logger.debug(MODULE_NAME, "Commit data prepared", debugMetadata);
  
  return { commitData, debugMetadata };
}

/**
 * Constructs a prompt for Gemini to analyze commit data.
 * 
 * @param commitData Simplified commit data for analysis
 * @returns Prompt string and metadata
 */
function constructGeminiPrompt(commitData: CommitDataForAnalysis[]): {
  prompt: string;
  promptMetadata: Record<string, unknown>;
} {
  logger.debug(MODULE_NAME, "Constructing Gemini prompt");
  
  const prompt = `
    Analyze these GitHub commits and provide a comprehensive summary.
    Generate a JSON response containing the following sections:

    1. "keyThemes": An array of 3-5 key themes or focus areas found in these commits
    2. "technicalAreas": An array of objects each containing "name" (technical area like "frontend", "database", "authentication", etc.) and "count" (number of commits in this area)
    3. "accomplishments": An array of 3-7 major accomplishments visible from these commits
    4. "commitsByType": An array of objects with "type" (like "feature", "bugfix", "refactor", "docs", etc.), "count", and "description" fields
    5. "timelineHighlights": An array of chronologically sorted objects with "date" and "description" highlighting key development milestones
    6. "overallSummary": A 2-3 sentence summary of the overall work represented by these commits

    The response should be valid JSON that can be parsed directly. Focus on meaningful technical analysis rather than just counting commits.
    Here's the commit data to analyze: ${JSON.stringify(commitData)}
  `;
  
  const promptMetadata = {
    promptLength: prompt.length,
    promptTokenEstimate: Math.round(prompt.length / 4), // rough estimate
  };
  
  logger.debug(MODULE_NAME, "Prompt constructed", promptMetadata);
  
  return { prompt, promptMetadata };
}

/**
 * Calls the Gemini API with the constructed prompt.
 * 
 * @param model Initialized Gemini model
 * @param prompt The prompt for Gemini
 * @param metadata Additional metadata for logging
 * @returns The raw text response from Gemini
 */
async function callGeminiAPI(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  prompt: string,
  metadata: Record<string, unknown>
): Promise<string> {
  logger.info(MODULE_NAME, "Calling Gemini API", metadata);
  
  const startTime = Date.now();
  const result: GenerateContentResult = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const endTime = Date.now();
  
  logger.info(MODULE_NAME, "Received Gemini API response", {
    responseTimeMs: endTime - startTime,
    responseLength: text.length,
  });
  
  logger.debug(MODULE_NAME, "Raw Gemini response", {
    response: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
  });
  
  return text;
}

/**
 * Extracts and parses JSON from the Gemini API response.
 * 
 * @param text Raw response text from Gemini
 * @returns Parsed CommitSummary object
 */
function parseGeminiResponse(text: string): CommitSummary {
  // Handle case where Gemini might wrap the JSON in markdown code blocks
  let jsonText = text;
  
  if (text.includes("```json")) {
    logger.debug(MODULE_NAME, "Detected JSON code block with explicit json tag");
    jsonText = text.split("```json")[1].split("```")[0].trim();
  } else if (text.includes("```")) {
    logger.debug(MODULE_NAME, "Detected generic code block, attempting to extract JSON");
    jsonText = text.split("```")[1].split("```")[0].trim();
  }
  
  logger.debug(MODULE_NAME, "Attempting to parse JSON response", {
    jsonPreview: jsonText.substring(0, 100) + (jsonText.length > 100 ? "..." : ""),
  });
  
  try {
    const parsedResponse = JSON.parse(jsonText) as CommitSummary;
    
    logger.info(MODULE_NAME, "Successfully parsed Gemini response", {
      themeCount: parsedResponse.keyThemes?.length || 0,
      technicalAreasCount: parsedResponse.technicalAreas?.length || 0,
      accomplishmentsCount: parsedResponse.accomplishments?.length || 0,
      commitTypeCount: parsedResponse.commitsByType?.length || 0,
      timelineHighlightsCount: parsedResponse.timelineHighlights?.length || 0,
    });
    
    return parsedResponse;
  } catch (parseError) {
    logger.error(MODULE_NAME, "Error parsing Gemini response", {
      error: parseError,
      rawResponsePreview: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
    });
    throw new Error("Failed to parse Gemini API response");
  }
}

/**
 * Main function to generate a commit summary using the Gemini API.
 * 
 * @param commits Array of GitHub commits to analyze
 * @param apiKey Gemini API key
 * @param accessToken Optional GitHub access token for validation
 * @returns A CommitSummary object with analysis results
 */
export async function generateCommitSummary(
  commits: Commit[],
  apiKey: string,
  accessToken?: string,
): Promise<CommitSummary> {
  const context = {
    commitsCount: commits.length,
    apiKeyProvided: !!apiKey,
    accessTokenProvided: !!accessToken,
  };
  
  logger.debug(MODULE_NAME, "generateCommitSummary called", context);

  // Validate input parameters
  if (!apiKey) {
    logger.error(MODULE_NAME, "No API key provided");
    throw new Error("Gemini API key is required");
  }
  
  // Validate GitHub token if provided
  if (accessToken) {
    const isValid = await isGitHubTokenValid(accessToken);
    if (!isValid) {
      logger.error(MODULE_NAME, "Invalid GitHub token provided");
      throw new Error("GitHub authentication failed. Please sign in again.");
    }
  }

  // Handle empty commits case
  if (commits.length === 0) {
    logger.info(MODULE_NAME, "No commits provided, returning empty summary");
    return createEmptyCommitSummary();
  }

  try {
    // Initialize Gemini model
    const model = initializeGeminiModel(apiKey);
    
    // Prepare commit data for analysis
    const { commitData, debugMetadata } = prepareCommitData(commits);
    
    // Construct prompt for Gemini
    const { prompt, promptMetadata } = constructGeminiPrompt(commitData);
    
    // Call Gemini API
    const responseText = await callGeminiAPI(model, prompt, {
      ...context,
      ...promptMetadata,
      ...debugMetadata,
    });
    
    // Parse and return the response
    return parseGeminiResponse(responseText);
  } catch (error) {
    logger.error(MODULE_NAME, "Error generating commit summary", { error, ...context });
    throw error;
  }
}
