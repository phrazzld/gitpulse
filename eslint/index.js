/**
 * GitPulse ESLint Plugin
 * 
 * Custom ESLint rules for the GitPulse project
 */

module.exports = {
  rules: {
    'no-direct-date-mock': require('./rules/no-direct-date-mock')
  }
};