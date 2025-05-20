# Chromatic Setup Guide

This document provides instructions for setting up and using Chromatic visual regression testing with GitPulse.

## Overview

Chromatic is a visual testing tool that integrates with Storybook to detect visual changes in components. It captures screenshots of each story and compares them across branches and commits to ensure UI consistency.

## Initial Setup

To set up Chromatic for the first time:

1. **Sign up for Chromatic**:
   - Go to [chromatic.com](https://www.chromatic.com/)
   - Sign in with your GitHub account
   - Create a new project linked to the GitPulse repository

2. **Get Project Token**:
   - After creating a project, Chromatic will generate a unique project token
   - Save this token as you'll need it for the next step

3. **Add Project Token to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `CHROMATIC_PROJECT_TOKEN`
   - Value: Paste your Chromatic project token
   - Click "Add secret"

4. **Initial Baseline**:
   - The first time Chromatic runs (after merging this configuration), it will create baseline snapshots
   - These will serve as the reference point for future visual comparisons

## How It Works

1. **Continuous Integration**:
   - When a PR is opened or code is pushed to the main branch, GitHub Actions automatically runs the Chromatic workflow
   - Storybook is built and all stories are captured as screenshots
   - These screenshots are compared to the baseline images

2. **Review Process**:
   - If Chromatic detects visual changes, it will flag them in the GitHub PR
   - The PR author and reviewers can click the Chromatic link to review the changes
   - Changes can be approved or rejected in the Chromatic UI

3. **Local Testing**:
   - Before creating a PR, you can run Chromatic locally to preview changes:
     ```bash
     npm run chromatic
     ```
   - This command will provide a URL to review the changes before pushing

## Configuration Options

The Chromatic GitHub Action is configured in `.github/workflows/chromatic.yml` with these key settings:

- `exitZeroOnChanges: true`: The workflow doesn't fail when visual changes are detected
- `exitOnceUploaded: true`: The workflow completes once snapshots are uploaded, without waiting for analysis
- `onlyChanged: true`: Only stories affected by code changes are tested
- `externals: '**/*.png, **/*.svg'`: Binary images are excluded from testing

## Best Practices

1. **Descriptive PR Comments**:
   - When making intentional UI changes, clearly describe them in the PR
   - Include screenshots if possible to help reviewers understand the changes

2. **Review All Visual Changes**:
   - Always review Chromatic results before merging a PR
   - Make sure all visual changes are intentional

3. **Handling False Positives**:
   - For dynamic content or animations, use the `chromatic` parameter:
     ```typescript
     export const AnimatedComponent: Story = {
       parameters: {
         chromatic: { disableSnapshot: true } // or pauseAnimationAtEnd: true
       }
     };
     ```

4. **Testing Responsive Design**:
   - Chromatic automatically captures multiple viewports
   - Review changes across all viewport sizes

## Troubleshooting

- **Build Failures**: Check the GitHub Actions logs for errors in the Storybook build
- **Screenshot Inconsistencies**: Environment differences can sometimes cause false positives (fonts, rendering engines)
- **Token Issues**: If Chromatic fails to authenticate, verify the `CHROMATIC_PROJECT_TOKEN` secret

## Further Documentation

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Integration](https://storybook.js.org/docs/react/workflows/visual-testing)
- [GitHub Actions Integration](https://www.chromatic.com/docs/github-actions)