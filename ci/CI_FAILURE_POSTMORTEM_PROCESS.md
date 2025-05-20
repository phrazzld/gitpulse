# CI Failure Post-mortem Process

## Purpose

The CI Failure Post-mortem Process provides a structured approach to analyzing, documenting, and learning from continuous integration (CI) failures. By systematically reviewing CI failures, we aim to:

1. Understand root causes of failures
2. Prevent similar issues from recurring
3. Improve our CI infrastructure and processes
4. Share knowledge across the team
5. Continuously enhance build reliability

## When to Conduct a Post-mortem

Not all CI failures require a formal post-mortem. Use the following criteria to determine when a post-mortem should be conducted:

### Always Conduct a Post-mortem When:

- A failure affects the main/master branch
- A failure persists for more than 24 hours
- A failure affects multiple PRs or developers
- A failure reveals a critical security or performance issue
- A failure exposes a fundamental flaw in our testing approach

### Consider a Post-mortem When:

- A non-obvious or complex failure occurs
- A failure is caused by environmental factors
- A failure reveals gaps in testing or validation
- A failure could have been prevented through better practices

### Post-mortem Not Required When:

- A simple, isolated syntax or linting error is fixed immediately
- A test failure is due to a known, already-documented issue
- The failure is due to an external service disruption that has its own incident report

## Roles and Responsibilities

### Post-mortem Owner

- The developer who fixes the CI failure or a designated team member
- Responsible for creating the post-mortem document
- Facilitates the post-mortem meeting
- Ensures follow-up actions are created and assigned

### Engineering Team

- Participates in post-mortem meetings
- Contributes to root cause analysis
- Helps identify preventive measures
- Takes ownership of assigned action items

### Engineering Lead

- Reviews all post-mortems
- Ensures resources are allocated for preventive measures
- Tracks trends across multiple post-mortems
- Incorporates learnings into development practices

## Post-mortem Process

### 1. Initiate (Within 24 hours of resolution)

- Create a new document using the [CI Failure Post-mortem Template](./CI_FAILURE_POSTMORTEM_TEMPLATE.md)
- Fill in the basic information section
- Document the timeline while events are fresh
- Save the document in the project repository at `postmortems/YYYY-MM-DD-brief-description.md`

### 2. Analyze (Within 48 hours of resolution)

- Complete the Failure Details section
- Conduct a thorough Root Cause Analysis
- Document the Resolution steps taken
- Identify initial Learnings and Preventive Measures

### 3. Review (Within 1 week of resolution)

- Schedule a 30-minute post-mortem review meeting
- Include all relevant team members
- Present the failure, resolution, and proposed preventive measures
- Gather additional insights and perspectives
- Finalize the action items and owners

### 4. Follow-up (Ongoing)

- Create GitHub issues for all action items
- Link the issues to the post-mortem document
- Track progress during regular sprint meetings
- Update the post-mortem document as action items are completed

## Regular Review Schedule

To ensure ongoing improvement, CI failures will be reviewed on a regular schedule:

- **Weekly**: Brief review of any CI failures during daily standups
- **Bi-weekly**: Dedicated 30-minute session to review recent post-mortems
- **Monthly**: Comprehensive review of all post-mortems from the past month, focusing on trends and systemic issues
- **Quarterly**: Deep-dive analysis of post-mortem data to identify patterns and opportunities for CI infrastructure improvements

## Tracking and Metrics

The following metrics will be tracked to measure the effectiveness of our CI system and post-mortem process:

- **Number of CI failures per week/month**
- **Mean time to detect (MTTD)** - time between failure and discovery
- **Mean time to resolve (MTTR)** - time between discovery and resolution
- **Failure categories** - distribution of failures by type
- **Recurring issues** - number of repeated failure patterns
- **Action item completion rate** - percentage of completed preventive measures

## Integration with Development Workflow

### Pull Requests

- When fixing CI issues, reference any relevant post-mortem documents in PR descriptions
- Include a brief summary of learnings applied from previous post-mortems

### Documentation

- Post-mortem documents should be stored in the `postmortems/` directory
- Significant CI improvements should be documented in the project's development guides

### Knowledge Sharing

- Key learnings from post-mortems should be shared in team meetings
- Consider creating a "CI Failure of the Month" session to highlight important lessons

## Sample Post-mortem

For an example of a completed post-mortem, see [2025-05-15-typescript-version-conflict.md](../postmortems/2025-05-15-typescript-version-conflict.md).

## Continuous Improvement

This post-mortem process itself should be periodically reviewed and improved. Suggestions for improving the process should be raised as GitHub issues with the label `process-improvement`.

---

**Document Metadata:**
- Version: 1.0
- Last Updated: 2025-05-20
- Next Review: 2025-08-20