# T010: Refactor FilterControls Component

## Task ID and Title
**T010**: Refactor FilterControls component

## Assessment
This is a simple task focused on removing organization-related filter controls from the FilterControls component.

## Implementation Approach
1. Remove the organizational filter display in the ANALYSIS PARAMETERS section
2. Remove the activityMode conditional display that shows different activity modes
3. Update the interface props to remove any unused parameters
4. Clean up imports if applicable
5. Run type checking and linting to verify the changes

## Details
1. In the interface/props:
   - Keep activityMode but mention it's hardcoded now
   - Keep other necessary props

2. In the JSX:
   - Remove the organizations display/filter in ANALYSIS PARAMETERS section
   - Simplify the activityMode display to only show "MY ACTIVITY" without conditionals

3. Testing:
   - Verify no visual regressions
   - Ensure type safety
   - Run linting