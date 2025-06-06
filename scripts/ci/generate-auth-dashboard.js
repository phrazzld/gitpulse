#!/usr/bin/env node

/**
 * Authentication Dashboard Generator
 * 
 * Generates a comprehensive dashboard for authentication CI health tracking.
 * Creates visual representations of metrics and trends over time.
 */

const fs = require('fs');
const path = require('path');

class AuthDashboardGenerator {
  constructor() {
    this.metricsDir = path.join(process.cwd(), 'ci-metrics');
    this.outputDir = path.join(process.cwd(), 'ci-dashboard');
  }

  /**
   * Load historical metrics
   */
  loadHistoricalMetrics() {
    const metricsFiles = [];
    
    if (!fs.existsSync(this.metricsDir)) {
      console.log('⚠️ No metrics directory found');
      return [];
    }
    
    const files = fs.readdirSync(this.metricsDir)
      .filter(file => file.startsWith('auth-health-') && file.endsWith('.json') && !file.includes('latest'))
      .sort();
    
    for (const file of files) {
      try {
        const filePath = path.join(this.metricsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        metricsFiles.push(data);
      } catch (error) {
        console.warn(`⚠️ Failed to load metrics file ${file}:`, error.message);
      }
    }
    
    return metricsFiles.slice(-50); // Keep last 50 runs
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboard(historicalMetrics) {
    const latestMetrics = historicalMetrics[historicalMetrics.length - 1] || {};
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitPulse Authentication CI Health Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f6f8fa;
            color: #24292f;
        }
        .header {
            background: linear-gradient(135deg, #24292f 0%, #40464d 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 2em;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #28a745;
        }
        .metric-card.warning {
            border-left-color: #ffc107;
        }
        .metric-card.error {
            border-left-color: #dc3545;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #586069;
            font-size: 0.9em;
            text-transform: uppercase;
            font-weight: 600;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .chart-title {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #24292f;
        }
        .recommendations {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #0969da;
        }
        .recommendation.high {
            border-left-color: #dc3545;
            background-color: #fff5f5;
        }
        .recommendation.medium {
            border-left-color: #ffc107;
            background-color: #fffbf0;
        }
        .recommendation.low {
            border-left-color: #28a745;
            background-color: #f0fff4;
        }
        .footer {
            text-align: center;
            color: #586069;
            margin-top: 40px;
            padding: 20px 0;
            border-top: 1px solid #e1e4e8;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-healthy {
            background-color: #28a745;
        }
        .status-warning {
            background-color: #ffc107;
        }
        .status-error {
            background-color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Authentication CI Health Dashboard</h1>
        <p>Real-time monitoring of authentication test reliability and performance</p>
        <p>Last updated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="metrics-grid">
        ${this.generateMetricCards(latestMetrics)}
    </div>

    <div class="charts-grid">
        <div class="chart-container">
            <div class="chart-title">Pass Rate Trend</div>
            <canvas id="passRateChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Health Score Trend</div>
            <canvas id="healthScoreChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Test Duration Trend</div>
            <canvas id="durationChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Error Rate Trend</div>
            <canvas id="errorChart"></canvas>
        </div>
    </div>

    ${this.generateRecommendationsSection(latestMetrics)}

    <div class="footer">
        <p>GitPulse Authentication CI Health Dashboard | Generated on ${new Date().toISOString()}</p>
        <p>For troubleshooting, see: <a href="../docs/testing/AUTHENTICATION_TROUBLESHOOTING.md">Authentication Troubleshooting Guide</a></p>
    </div>

    <script>
        const historicalData = ${JSON.stringify(historicalMetrics)};
        ${this.generateChartScripts()}
    </script>
</body>
</html>`;
    
    return html;
  }

  /**
   * Generate metric cards HTML
   */
  generateMetricCards(latestMetrics) {
    const healthScore = latestMetrics.healthScore || 0;
    const passRate = latestMetrics.authTests?.passRate || 0;
    const totalTests = latestMetrics.authTests?.total || 0;
    const duration = latestMetrics.authTests?.duration || 0;
    const errors = latestMetrics.errors?.length || 0;
    
    const healthStatus = healthScore >= 90 ? '' : healthScore >= 70 ? 'warning' : 'error';
    const passRateStatus = passRate >= 95 ? '' : passRate >= 85 ? 'warning' : 'error';
    
    return `
        <div class="metric-card ${healthStatus}">
            <div class="metric-label">
                <span class="status-indicator status-${healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'error'}"></span>
                Health Score
            </div>
            <div class="metric-value">${healthScore}/100</div>
        </div>
        <div class="metric-card ${passRateStatus}">
            <div class="metric-label">
                <span class="status-indicator status-${passRate >= 95 ? 'healthy' : passRate >= 85 ? 'warning' : 'error'}"></span>
                Pass Rate
            </div>
            <div class="metric-value">${passRate.toFixed(1)}%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Total Tests</div>
            <div class="metric-value">${totalTests}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Avg Duration</div>
            <div class="metric-value">${(duration / 1000).toFixed(1)}s</div>
        </div>
        <div class="metric-card ${errors > 0 ? 'error' : ''}">
            <div class="metric-label">
                <span class="status-indicator status-${errors === 0 ? 'healthy' : 'error'}"></span>
                Errors
            </div>
            <div class="metric-value">${errors}</div>
        </div>
    `;
  }

  /**
   * Generate recommendations section
   */
  generateRecommendationsSection(latestMetrics) {
    const recommendations = latestMetrics.recommendations || [];
    
    if (recommendations.length === 0) {
      return `
        <div class="recommendations">
            <h2>📊 System Status</h2>
            <div class="recommendation low">
                <strong>✅ All systems healthy</strong><br>
                No recommendations at this time. Authentication system is performing well.
            </div>
        </div>
      `;
    }
    
    const recommendationItems = recommendations.map(rec => `
      <div class="recommendation ${rec.severity}">
          <strong>${rec.severity.toUpperCase()}: ${rec.message}</strong><br>
          <em>Action: ${rec.action}</em>
      </div>
    `).join('');
    
    return `
      <div class="recommendations">
          <h2>💡 Recommendations</h2>
          ${recommendationItems}
      </div>
    `;
  }

  /**
   * Generate Chart.js scripts
   */
  generateChartScripts() {
    return `
      // Extract data for charts
      const timestamps = historicalData.map(d => new Date(d.timestamp).toLocaleDateString());
      const passRates = historicalData.map(d => d.authTests?.passRate || 0);
      const healthScores = historicalData.map(d => d.healthScore || 0);
      const durations = historicalData.map(d => (d.authTests?.duration || 0) / 1000);
      const errorCounts = historicalData.map(d => d.errors?.length || 0);

      // Chart configuration
      const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };

      // Pass Rate Chart
      new Chart(document.getElementById('passRateChart'), {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [{
            label: 'Pass Rate (%)',
            data: passRates,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          ...chartConfig,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });

      // Health Score Chart
      new Chart(document.getElementById('healthScoreChart'), {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [{
            label: 'Health Score',
            data: healthScores,
            borderColor: '#0969da',
            backgroundColor: 'rgba(9, 105, 218, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          ...chartConfig,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });

      // Duration Chart
      new Chart(document.getElementById('durationChart'), {
        type: 'bar',
        data: {
          labels: timestamps,
          datasets: [{
            label: 'Duration (seconds)',
            data: durations,
            backgroundColor: '#ffc107'
          }]
        },
        options: chartConfig
      });

      // Error Chart
      new Chart(document.getElementById('errorChart'), {
        type: 'bar',
        data: {
          labels: timestamps,
          datasets: [{
            label: 'Error Count',
            data: errorCounts,
            backgroundColor: '#dc3545'
          }]
        },
        options: chartConfig
      });
    `;
  }

  /**
   * Generate dashboard
   */
  async generateAuthDashboard() {
    console.log('📊 Generating authentication dashboard...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Load historical metrics
    const historicalMetrics = this.loadHistoricalMetrics();
    
    if (historicalMetrics.length === 0) {
      console.log('⚠️ No historical metrics found - creating placeholder dashboard');
    }
    
    // Generate HTML dashboard
    const dashboardHtml = this.generateDashboard(historicalMetrics);
    
    // Save dashboard
    const dashboardPath = path.join(this.outputDir, 'index.html');
    fs.writeFileSync(dashboardPath, dashboardHtml);
    
    // Generate README for dashboard
    const readmePath = path.join(this.outputDir, 'README.md');
    const readmeContent = this.generateDashboardReadme();
    fs.writeFileSync(readmePath, readmeContent);
    
    console.log(`📊 Dashboard generated: ${dashboardPath}`);
    console.log(`📋 Dashboard README: ${readmePath}`);
    
    return dashboardPath;
  }

  /**
   * Generate README for dashboard
   */
  generateDashboardReadme() {
    return `# Authentication CI Health Dashboard

This dashboard provides real-time monitoring of authentication test reliability and performance in CI environments.

## Features

- **Health Score Tracking**: Overall system health from 0-100
- **Pass Rate Monitoring**: Authentication test success rates over time
- **Performance Metrics**: Test execution duration trends
- **Error Tracking**: Error and warning detection
- **Automated Recommendations**: AI-generated suggestions for improvements

## Usage

Open \`index.html\` in a web browser to view the dashboard.

## Metrics Explained

### Health Score
- **90-100**: Excellent - System performing optimally
- **70-89**: Good - Minor issues that should be monitored
- **50-69**: Fair - Issues requiring attention
- **0-49**: Poor - Immediate action required

### Pass Rate
- **95-100%**: Excellent reliability
- **85-94%**: Acceptable with room for improvement
- **Below 85%**: Requires investigation

### Recommendations
- **High**: Immediate action required
- **Medium**: Should be addressed soon
- **Low**: Monitor or address when convenient

## Troubleshooting

For detailed troubleshooting information, see:
- [Authentication Troubleshooting Guide](../docs/testing/AUTHENTICATION_TROUBLESHOOTING.md)
- [CI Workflow Alignment Documentation](../docs/development/CI_WORKFLOW_ALIGNMENT.md)

## Automation

This dashboard is automatically updated by CI workflows when authentication tests run.

Last updated: ${new Date().toISOString()}
`;
  }
}

// Main execution
async function main() {
  const generator = new AuthDashboardGenerator();
  
  try {
    await generator.generateAuthDashboard();
    console.log('✅ Authentication dashboard generation completed');
  } catch (error) {
    console.error('❌ Dashboard generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { AuthDashboardGenerator };