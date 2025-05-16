import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Executes npm audit with JSON output
 * @returns Promise that resolves with the JSON output string
 */
export async function executeNpmAudit(): Promise<string> {
  try {
    // Execute npm audit with JSON output
    // Note: npm audit will exit with a non-zero code if vulnerabilities are found,
    // but we still want to capture its output for processing
    const { stdout, stderr } = await execFileAsync('npm', ['audit', '--json'], {
      // Set a reasonable timeout
      timeout: 60000,
      // Increase buffer size for large audit outputs
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stderr && stderr.trim()) {
      console.error('npm audit stderr:', stderr);
    }

    if (!stdout || !stdout.trim()) {
      throw new Error('npm audit produced no output');
    }

    return stdout;
  } catch (error: any) {
    // Check if this is a normal "vulnerabilities found" exit from npm audit
    if (error.stdout && error.stdout.trim()) {
      // This is expected - npm audit exits with a non-zero code when it finds vulnerabilities
      // We still want to process its output
      return error.stdout;
    }

    // This is a true execution error
    throw new Error(`Failed to execute npm audit: ${error.message}`);
  }
}