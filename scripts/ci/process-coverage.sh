#!/bin/bash

# Enhanced Coverage Processing Script for CI
# Handles coverage JSON validation, error recovery, and detailed reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to log debugging information
log_debug() {
    if [[ "${DEBUG_COVERAGE:-false}" == "true" ]]; then
        print_status $BLUE "DEBUG: $1" >&2
    fi
}

# Function to validate JSON format
validate_json() {
    local file=$1
    local file_type=$2
    
    log_debug "Validating JSON format for $file"
    
    if [[ ! -f "$file" ]]; then
        print_status $RED "❌ File not found: $file"
        return 1
    fi
    
    # Check if file is empty
    if [[ ! -s "$file" ]]; then
        print_status $RED "❌ File is empty: $file"
        return 1
    fi
    
    # Try to parse JSON
    if ! jq . "$file" > /dev/null 2>&1; then
        print_status $RED "❌ Invalid JSON format in $file"
        
        # Show first few lines for debugging
        echo "First 5 lines of $file:"
        head -5 "$file" || echo "Could not read file"
        echo "Last 5 lines of $file:"
        tail -5 "$file" || echo "Could not read file"
        
        return 1
    fi
    
    print_status $GREEN "✅ Valid JSON format in $file"
    return 0
}

# Function to extract coverage metrics with error handling
extract_coverage_metric() {
    local file=$1
    local metric_path=$2
    local default_value=${3:-0}
    
    log_debug "Extracting metric: $metric_path from $file"
    
    local value
    value=$(jq -r "$metric_path // \"$default_value\"" "$file" 2>/dev/null)
    
    # Validate that the value is a number
    if ! [[ "$value" =~ ^[0-9]+\.?[0-9]*$ ]]; then
        print_status $YELLOW "⚠️  Invalid metric value for $metric_path: '$value', using default: $default_value"
        value=$default_value
    fi
    
    echo "$value"
}

# Function to set GitHub Actions output safely
set_github_output() {
    local key=$1
    local value=$2
    
    if [[ -n "$GITHUB_OUTPUT" ]]; then
        echo "${key}=${value}" >> $GITHUB_OUTPUT
        log_debug "Set GitHub output: ${key}=${value}"
    else
        log_debug "GITHUB_OUTPUT not set, would have set: ${key}=${value}"
    fi
}

# Function to create coverage report summary
create_coverage_summary() {
    local coverage_file=$1
    local total_lines=$2
    local total_statements=$3
    local total_functions=$4
    local total_branches=$5
    
    cat > coverage-summary-report.txt << EOF
Coverage Processing Summary
==========================
Source File: $coverage_file
Processing Time: $(date)

Metrics Extracted:
- Lines: ${total_lines}%
- Statements: ${total_statements}%
- Functions: ${total_functions}%
- Branches: ${total_branches}%

File Validation:
- JSON Format: Valid
- File Size: $(stat -f%z "$coverage_file" 2>/dev/null || stat -c%s "$coverage_file" 2>/dev/null || echo "Unknown") bytes
EOF

    print_status $GREEN "📄 Coverage summary report created: coverage-summary-report.txt"
}

# Main coverage processing function
process_coverage() {
    print_status $BLUE "🔍 Starting enhanced coverage processing..."
    
    local original_file="coverage/coverage-summary.json"
    local fixed_file="coverage/coverage-summary-fixed.json"
    local coverage_file=""
    
    # Step 1: Check if original coverage file exists
    if [[ ! -f "$original_file" ]]; then
        print_status $RED "❌ Coverage summary file not found: $original_file"
        print_status $YELLOW "This could indicate:"
        print_status $YELLOW "  - Tests were not run with coverage"
        print_status $YELLOW "  - Jest configuration issue"
        print_status $YELLOW "  - Build process failed before coverage generation"
        
        # Set default values
        set_github_output "total_lines" "0"
        set_github_output "total_statements" "0"
        set_github_output "total_functions" "0"
        set_github_output "total_branches" "0"
        set_github_output "coverage_status" "missing"
        
        return 1
    fi
    
    print_status $GREEN "✅ Found coverage file: $original_file"
    
    # Step 2: Try to validate original file
    if validate_json "$original_file" "original"; then
        print_status $GREEN "✅ Original coverage file is valid JSON"
        coverage_file="$original_file"
    else
        print_status $YELLOW "⚠️  Original file has JSON issues, attempting to fix..."
        
        # Step 3: Try to fix the coverage file
        if command -v node > /dev/null && [[ -f "scripts/fix-coverage-json-simple.js" ]]; then
            print_status $BLUE "🔧 Running coverage JSON fix script..."
            
            if node scripts/fix-coverage-json-simple.js; then
                print_status $GREEN "✅ Coverage fix script completed"
                
                if [[ -f "$fixed_file" ]] && validate_json "$fixed_file" "fixed"; then
                    print_status $GREEN "✅ Fixed coverage file is valid"
                    coverage_file="$fixed_file"
                else
                    print_status $RED "❌ Fix script did not produce valid JSON"
                    coverage_file=""
                fi
            else
                print_status $RED "❌ Coverage fix script failed"
                coverage_file=""
            fi
        else
            print_status $RED "❌ Fix script not available"
            coverage_file=""
        fi
    fi
    
    # Step 4: Extract metrics or use defaults
    if [[ -n "$coverage_file" ]]; then
        print_status $BLUE "📊 Extracting coverage metrics from: $coverage_file"
        
        local total_lines=$(extract_coverage_metric "$coverage_file" ".total.lines.pct" "0")
        local total_statements=$(extract_coverage_metric "$coverage_file" ".total.statements.pct" "0")
        local total_functions=$(extract_coverage_metric "$coverage_file" ".total.functions.pct" "0")
        local total_branches=$(extract_coverage_metric "$coverage_file" ".total.branches.pct" "0")
        
        # Validate extracted values are reasonable (0-100%)
        for metric in "$total_lines" "$total_statements" "$total_functions" "$total_branches"; do
            if (( $(echo "$metric > 100" | bc -l) )) || (( $(echo "$metric < 0" | bc -l) )); then
                print_status $YELLOW "⚠️  Suspicious coverage value: $metric%, this may indicate a parsing issue"
            fi
        done
        
        # Set GitHub Actions outputs
        set_github_output "total_lines" "$total_lines"
        set_github_output "total_statements" "$total_statements"
        set_github_output "total_functions" "$total_functions"
        set_github_output "total_branches" "$total_branches"
        set_github_output "coverage_status" "success"
        
        # Create detailed summary
        create_coverage_summary "$coverage_file" "$total_lines" "$total_statements" "$total_functions" "$total_branches"
        
        print_status $GREEN "✅ Coverage processing completed successfully"
        print_status $GREEN "📊 Coverage: Lines=${total_lines}%, Statements=${total_statements}%, Functions=${total_functions}%, Branches=${total_branches}%"
        
    else
        print_status $RED "❌ Unable to process coverage data"
        print_status $YELLOW "Fallback: Setting all coverage metrics to 0%"
        
        # Set fallback values
        set_github_output "total_lines" "0"
        set_github_output "total_statements" "0"
        set_github_output "total_functions" "0"
        set_github_output "total_branches" "0"
        set_github_output "coverage_status" "failed"
        
        print_status $YELLOW "📋 Troubleshooting steps:"
        print_status $YELLOW "  1. Check that 'npm run test:ci' completed successfully"
        print_status $YELLOW "  2. Verify Jest configuration includes coverage settings"
        print_status $YELLOW "  3. Ensure coverage directory exists and has proper permissions"
        print_status $YELLOW "  4. Check for any Jest or Node.js version compatibility issues"
        
        return 1
    fi
}

# Function to display help
show_help() {
    cat << EOF
Enhanced Coverage Processing Script

Usage: $0 [options]

Options:
  --debug     Enable debug output
  --help      Show this help message

Environment Variables:
  DEBUG_COVERAGE    Set to 'true' to enable debug output
  GITHUB_OUTPUT     Path to GitHub Actions output file (auto-detected in CI)

Examples:
  $0                    # Process coverage with standard output
  $0 --debug            # Process coverage with debug information
  DEBUG_COVERAGE=true $0  # Alternative way to enable debug
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
            export DEBUG_COVERAGE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_status $RED "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status $BLUE "🚀 Enhanced Coverage Processing"
    print_status $BLUE "==============================="
    
    # Check dependencies
    if ! command -v jq > /dev/null; then
        print_status $RED "❌ jq is required but not installed"
        exit 1
    fi
    
    if ! command -v bc > /dev/null; then
        print_status $YELLOW "⚠️  bc is not available, skipping range validation"
    fi
    
    # Process coverage
    if process_coverage; then
        print_status $GREEN "🎉 Coverage processing completed successfully"
        exit 0
    else
        print_status $YELLOW "⚠️  Coverage processing completed with warnings"
        exit 0  # Don't fail the CI build on coverage processing issues
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi