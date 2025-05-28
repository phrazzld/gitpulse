# Storybook Build Optimization for Pre-commit Hooks

## Overview

We've implemented a smart caching system to optimize Storybook builds during pre-commit accessibility checks, reducing the time from >10 minutes to <2 minutes for unchanged configurations.

## The Problem

Previously, every commit that included story files would trigger a full Storybook build before running accessibility checks. This resulted in:
- Pre-commit hooks timing out after 10 minutes
- Developers bypassing checks with `--no-verify`
- Reduced productivity due to long wait times

## The Solution

### Configuration-Based Caching

The optimization uses a configuration hash to determine if a rebuild is necessary:

1. **Config Hash Calculation**: Computes SHA256 hash of key configuration files:
   - `.storybook/main.ts`
   - `.storybook/preview.ts`
   - `.storybook/test-runner.js`
   - `package.json`
   - `next.config.js`

2. **Build Info Storage**: After each build, stores metadata in `storybook-static/build-info.json`:
   ```json
   {
     "configHash": "abc123...",
     "buildTimestamp": "2025-05-28T10:00:00Z",
     "nodeVersion": "v20.0.0",
     "storybookVersion": "^7.0.0"
   }
   ```

3. **Cache Validation**: Before building, checks if:
   - `storybook-static` directory exists
   - `build-info.json` exists
   - Config hash matches current configuration
   - Build is less than 24 hours old

### Implementation Details

#### Key Files

- `scripts/accessibility/check-a11y-staged-stories.js`: Main pre-commit hook script
- `scripts/storybook/post-build.js`: Generates build-info.json after builds
- `scripts/accessibility/__tests__/check-a11y-staged-stories.test.js`: Comprehensive test suite

#### Cache Logic Flow

```
1. Developer commits changes with story files
2. Pre-commit hook runs
3. Check if valid cache exists:
   - If YES: Skip build, run accessibility checks directly
   - If NO: Build Storybook, generate build-info.json
4. Run accessibility checks with 2-minute timeout
```

### Performance Improvements

- **Before**: >10 minutes per commit with story changes
- **After**: 
  - ~30 seconds with valid cache
  - ~3-5 minutes for fresh build + checks
  - 2-minute timeout prevents infinite hangs

## Usage

### For Developers

The caching system works automatically. You'll see messages like:

```bash
📦 Using cached Storybook build (configuration unchanged)
```

or

```bash
⚙️ Storybook configuration has changed. Rebuilding...
```

### Debugging

Enable verbose output to see cache decisions:
```bash
DEBUG=1 git commit -m "your message"
```

### Force Rebuild

To force a fresh build, remove the cache:
```bash
rm -rf storybook-static
```

### Skip Checks (Emergency Only)

If you need to bypass checks temporarily:
```bash
A11Y_SKIP=1 git commit -m "your message"
```
**Always create a follow-up task to fix accessibility issues!**

## Configuration Changes That Trigger Rebuilds

Any changes to these files will invalidate the cache:
- Storybook configuration (main.ts, preview.ts)
- Test runner configuration
- Package dependencies
- Next.js configuration

## Monitoring

The system logs key metrics:
- Cache hit/miss status
- Build times
- Config hash changes
- Timeout occurrences

## Future Improvements

1. **Incremental Builds**: Only rebuild affected stories
2. **Distributed Cache**: Share cache between team members
3. **Parallel Testing**: Run accessibility checks in parallel
4. **Smart Filtering**: Better detection of which stories need testing

## Troubleshooting

### Build Still Times Out

1. Check system resources (CPU, memory)
2. Reduce number of staged files
3. Use `A11Y_SKIP=1` temporarily

### Cache Not Working

1. Check if `storybook-static/build-info.json` exists
2. Run with `DEBUG=1` to see cache validation details
3. Ensure post-build script has execute permissions

### False Cache Hits

If builds seem stale despite config changes:
1. Check which files are included in hash calculation
2. Manually delete `storybook-static` directory
3. Report issue with specific config change that wasn't detected