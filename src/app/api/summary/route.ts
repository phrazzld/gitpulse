import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchAllRepositories, fetchCommitsForRepositories, Commit } from "@/lib/github";
import { generateCommitSummary } from "@/lib/gemini";
import { logger } from "@/lib/logger";

const MODULE_NAME = "api:summary";

export async function GET(request: NextRequest) {
  logger.debug(MODULE_NAME, "GET /api/summary request received", { 
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers)
  });
  
  const session = await getServerSession(authOptions);
  
  if (!session || !session.accessToken) {
    logger.warn(MODULE_NAME, "Unauthorized request - no valid session", { 
      sessionExists: !!session,
      hasAccessToken: !!session?.accessToken
    });
    
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  logger.info(MODULE_NAME, "Authenticated user requesting summary", { 
    user: session.user?.email || session.user?.name || 'unknown'
  });

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  const type = searchParams.get("type");
  const teamMembers = searchParams.get("teamMembers");
  const repoParam = searchParams.get("repos");
  
  logger.debug(MODULE_NAME, "Parsed query parameters", {
    since,
    until,
    type: type || "individual",
    teamMembers: teamMembers ? teamMembers.split(",") : null,
    repos: repoParam ? repoParam.split(",") : []
  });
  
  if (!since || !until) {
    logger.warn(MODULE_NAME, "Missing required date parameters");
    return new NextResponse(JSON.stringify({ error: "Missing required parameters: since and until dates" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get Gemini API key from environment variable
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    logger.error(MODULE_NAME, "Missing Gemini API key in environment variables");
    return new NextResponse(JSON.stringify({ error: "Server configuration error: Missing Gemini API key" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Parse the repositories parameter
    const selectedRepos = repoParam ? repoParam.split(",") : [];
    logger.debug(MODULE_NAME, "Selected repositories", { count: selectedRepos.length, repos: selectedRepos });
    
    // If no specific repos are selected, fetch all accessible repos
    let reposToAnalyze = selectedRepos;
    if (reposToAnalyze.length === 0) {
      logger.info(MODULE_NAME, "No specific repos selected, fetching all accessible repos");
      const allRepos = await fetchAllRepositories(session.accessToken);
      reposToAnalyze = allRepos.map(repo => repo.full_name);
      logger.debug(MODULE_NAME, "All accessible repositories", { count: reposToAnalyze.length });
    }
    
    const requestStartTime = Date.now();
    
    // Individual summary for the authenticated user
    if (type === "individual" || !type) {
      logger.info(MODULE_NAME, "Generating individual summary", {
        user: session.user?.name,
        repoCount: reposToAnalyze.length,
        dateRange: { since, until }
      });
      
      const commitFetchStartTime = Date.now();
      
      // Extract author from either username or derive from repository
      // First try with username from session, GitHub API will try alternatives if needed
      const authorName = session.user?.name || "";
      
      logger.debug(MODULE_NAME, "Fetching commits with author", { 
        authorName,
        firstRepo: reposToAnalyze.length > 0 ? reposToAnalyze[0] : null
      });
      
      const commits = await fetchCommitsForRepositories(
        session.accessToken, 
        reposToAnalyze, 
        since, 
        until,
        authorName
      );
      const commitFetchEndTime = Date.now();
      
      logger.info(MODULE_NAME, "Fetched commits for individual summary", {
        user: session.user?.name,
        commitCount: commits.length,
        timeMs: commitFetchEndTime - commitFetchStartTime
      });
      
      // Generate AI summary using Gemini
      logger.debug(MODULE_NAME, "Generating AI summary for individual commits");
      const aiSummaryStartTime = Date.now();
      const aiSummary = await generateCommitSummary(commits, geminiApiKey);
      const aiSummaryEndTime = Date.now();
      
      logger.info(MODULE_NAME, "Generated AI summary for individual commits", {
        timeMs: aiSummaryEndTime - aiSummaryStartTime,
        keyThemes: aiSummary.keyThemes.length,
        technicalAreas: aiSummary.technicalAreas.length
      });
      
      const stats = generateBasicStats(commits);
      logger.debug(MODULE_NAME, "Generated basic stats", stats);
      
      const totalTime = Date.now() - requestStartTime;
      logger.info(MODULE_NAME, "Completed individual summary request", {
        totalTimeMs: totalTime,
        commitCount: commits.length,
        repoCount: stats.repositories.length
      });
      
      return NextResponse.json({
        user: session.user?.name,
        commits,
        stats,
        aiSummary
      });
    } 
    // Team summary for multiple users
    else if (type === "team" && teamMembers) {
      const users = teamMembers.split(",");
      logger.info(MODULE_NAME, "Generating team summary", {
        teamSize: users.length,
        teamMembers: users,
        repoCount: reposToAnalyze.length,
        dateRange: { since, until }
      });
      
      // Fetch commits for each team member
      logger.debug(MODULE_NAME, "Fetching commits for all team members");
      const teamCommitsStartTime = Date.now();
      
      const teamCommits = await Promise.all(
        users.map(async (user) => {
          logger.debug(MODULE_NAME, `Fetching commits for team member: ${user}`);
          const userStartTime = Date.now();
          
          // For team members, we try the provided name but our enhanced fetchCommitsForRepositories
          // function will try alternatives if no commits are found
          logger.debug(MODULE_NAME, `Fetching commits for team member with name: ${user}`);
          
          const userCommits = await fetchCommitsForRepositories(
            session.accessToken, 
            reposToAnalyze, 
            since, 
            until,
            user
          );
          
          const userEndTime = Date.now();
          logger.info(MODULE_NAME, `Fetched commits for team member: ${user}`, {
            commitCount: userCommits.length,
            timeMs: userEndTime - userStartTime
          });
          
          const stats = generateBasicStats(userCommits);
          
          return {
            user,
            commits: userCommits,
            stats,
          };
        })
      );
      
      const teamCommitsEndTime = Date.now();
      logger.info(MODULE_NAME, "Completed fetching commits for all team members", {
        timeMs: teamCommitsEndTime - teamCommitsStartTime
      });
      
      // Combine all commits for AI analysis
      logger.debug(MODULE_NAME, "Combining team commits for AI analysis");
      const allTeamCommits = teamCommits.flatMap(member => member.commits);
      
      logger.info(MODULE_NAME, "Combined team commits", {
        totalCommits: allTeamCommits.length,
        commitsByMember: teamCommits.map(member => ({
          user: member.user,
          count: member.commits.length
        }))
      });
      
      // Generate AI summary for all team commits
      logger.debug(MODULE_NAME, "Generating AI summary for team commits");
      const teamAiStartTime = Date.now();
      const aiSummary = await generateCommitSummary(allTeamCommits, geminiApiKey);
      const teamAiEndTime = Date.now();
      
      logger.info(MODULE_NAME, "Generated AI summary for team commits", {
        timeMs: teamAiEndTime - teamAiStartTime,
        keyThemes: aiSummary.keyThemes.length,
        technicalAreas: aiSummary.technicalAreas.length
      });
      
      const teamStats = aggregateTeamStats(teamCommits);
      logger.debug(MODULE_NAME, "Aggregated team stats", teamStats);
      
      const totalTime = Date.now() - requestStartTime;
      logger.info(MODULE_NAME, "Completed team summary request", {
        totalTimeMs: totalTime,
        teamSize: users.length,
        totalCommits: allTeamCommits.length,
        repoCount: teamStats.repositories.length
      });
      
      return NextResponse.json({
        team: users,
        members: teamCommits,
        teamStats,
        aiSummary
      });
    }
    
    logger.warn(MODULE_NAME, "Invalid request parameters", {
      type,
      hasTeamMembers: !!teamMembers
    });
    
    return new NextResponse(JSON.stringify({ error: "Invalid request parameters" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logger.error(MODULE_NAME, "Error generating summary", { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new NextResponse(JSON.stringify({ 
      error: "Failed to generate summary", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

function generateBasicStats(commits: Commit[]) {
  logger.debug(MODULE_NAME, "Generating basic stats", { commitCount: commits.length });
  
  // Generate basic statistics about the commits
  const stats = {
    totalCommits: commits.length,
    repositories: [...new Set(commits.map((commit) => commit.repository?.full_name || commit.html_url.split('/').slice(3, 5).join('/')))],
    dates: [...new Set(commits.map((commit) => commit.commit.author.date.split('T')[0]))],
  };
  
  logger.debug(MODULE_NAME, "Basic stats generated", {
    totalCommits: stats.totalCommits,
    uniqueRepos: stats.repositories.length,
    uniqueDates: stats.dates.length
  });
  
  return stats;
}

function aggregateTeamStats(teamCommits: any[]) {
  logger.debug(MODULE_NAME, "Aggregating team stats", { memberCount: teamCommits.length });
  
  // Aggregate statistics across all team members
  const repositories = new Set<string>();
  const dates = new Set<string>();
  let totalCommits = 0;
  
  teamCommits.forEach((member) => {
    totalCommits += member.stats.totalCommits;
    member.stats.repositories.forEach((repo: string) => repositories.add(repo));
    member.stats.dates.forEach((date: string) => dates.add(date));
  });
  
  const stats = {
    totalCommits,
    repositories: Array.from(repositories),
    dates: Array.from(dates),
    memberCount: teamCommits.length,
  };
  
  logger.debug(MODULE_NAME, "Team stats aggregated", {
    totalCommits: stats.totalCommits,
    uniqueRepos: stats.repositories.length,
    uniqueDates: stats.dates.length,
    memberCount: stats.memberCount,
    commitsByMember: teamCommits.map(member => ({
      user: member.user,
      commitCount: member.stats.totalCommits
    }))
  });
  
  return stats;
}