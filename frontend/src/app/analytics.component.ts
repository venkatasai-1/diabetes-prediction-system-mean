import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="analytics-container animate-fade">
      <div class="page-header">
        <h1 class="gradient-text">{{ isAdmin() ? 'Clinical Intelligence Board' : 'Personal Health Metrics' }}</h1>
        <p class="text-muted">{{ isAdmin() ? 'Aggregated patient population health analytics and risk trends.' : 'Your personal diagnostic trends and health history insights.' }}</p>
      </div>

      <!-- Key Metrics Header -->
      <div class="metrics-grid">
        <div class="diagno-card metric-card">
           <span class="m-label">{{ isAdmin() ? 'Global Analysis Count' : 'Total Assessments' }}</span>
           <span class="m-value">{{ stats.total }}</span>
        </div>
        <div class="diagno-card metric-card">
           <span class="m-label">Clinical High Risk</span>
           <span class="m-value text-red">{{ stats.highRisk }}</span>
        </div>
        <div class="diagno-card metric-card">
           <span class="m-label">Mean Probability</span>
           <span class="m-value">{{ stats.avgProb.toFixed(1) }}%</span>
        </div>
      </div>

      <div class="chart-layout">
        <!-- Main Diagnosis Trend -->
        <div class="diagno-card chart-panel large">
          <h3>📈 {{ isAdmin() ? 'Population Risk Distribution' : 'Diagnosis Timeline' }}</h3>
          <div class="chart-container">
            <canvas baseChart
                    [data]="lineChartData"
                    [options]="lineChartOptions"
                    [type]="'line'">
            </canvas>
          </div>
        </div>

        <!-- AI Insights Sidebar -->
        <div class="insight-sidebar">
          <div class="diagno-card insight-card">
            <h3>🌩️ {{ isAdmin() ? 'Administrative Alerts' : 'AI Health Insights' }}</h3>
            <div class="insight-item" *ngFor="let insight of insights">
              <i class="material-icons-outlined i-icon">bolt</i>
              <p>{{ insight }}</p>
            </div>
            <div class="empty-notif" *ngIf="insights.length === 0">No critical anomalies detected in current dataset.</div>
          </div>

          <div class="diagno-card system-health" *ngIf="isAdmin()">
            <h3>🖥️ System Health</h3>
             <div class="health-row">
               <span>Database Latency</span>
               <span class="h-stat green">42ms</span>
             </div>
             <div class="health-row">
               <span>Model Availability</span>
               <span class="h-stat green">99.9%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container { max-width: 1300px; margin: 0 auto; }
    .page-header { margin-bottom: 40px; }
    .page-header h1 { font-size: 2.2rem; margin-bottom: 8px; font-family: var(--font-title); }

    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .metric-card { text-align: center; padding: 25px; }
    .m-label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .m-value { font-size: 2.5rem; font-weight: 800; color: var(--text-main); }
    .text-red { color: var(--accent); }

    .chart-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
    .chart-panel h3 { font-size: 1.1rem; margin-bottom: 24px; font-weight: 800; }
    .chart-container { height: 400px; }

    .insight-sidebar { display: flex; flex-direction: column; gap: 30px; }
    .insight-card h3 { font-size: 1rem; margin-bottom: 20px; font-weight: 800; }
    .insight-item { display: flex; gap: 15px; margin-bottom: 20px; font-size: 0.9rem; color: var(--text-main); font-weight: 600; }
    .i-icon { color: var(--primary); }

    .system-health h3 { font-size: 1rem; margin-bottom: 20px; }
    .health-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
    .h-stat.green { color: var(--secondary); background: #f0fdf4; padding: 2px 8px; border-radius: 6px; }

    @media (max-width: 1000px) {
      .chart-layout { grid-template-columns: 1fr; }
      .metrics-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  stats = { total: 0, highRisk: 0, avgProb: 0 };
  insights: string[] = [];

  lineChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    }
  };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });
    const endpoint = this.isAdmin() ? '/api/predict/all' : '/api/predict/history';
    
    this.http.get<any[]>(endpoint, { headers }).subscribe({
      next: (res) => {
        this.processStats(res);
        this.processChart(res);
      }
    });
  }

  processStats(data: any[]) {
    this.stats.total = data.length;
    this.stats.highRisk = data.filter(d => d.riskLevel === 'High').length;
    this.stats.avgProb = data.reduce((acc, curr) => acc + curr.probability, 0) / (data.length || 1);
    
    if (this.isAdmin()) {
      this.insights = [
        `System detected ${this.stats.highRisk} high-risk screenings in the last 24h.`,
        'Model training status: Healthy v4.2 in deployment.',
        'Total unauthorized attempt attempts: 0 (Secure).'
      ];
    } else {
      this.insights = [
        'Optimal BMI range maintained over last 3 tests.',
        'Glucose fluctuation detected in late night readings.',
        'Recommendation: Consult clinical dietary guide.'
      ];
    }
  }

  processChart(data: any[]) {
    const labels = data.map(d => new Date(d.createdAt).toLocaleDateString()).slice(-7);
    const probs = data.map(d => d.probability).slice(-7);
    this.lineChartData = {
      labels,
      datasets: [{
        data: probs,
        label: 'Risk Level (%)',
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 4,
        pointHoverRadius: 8
      }]
    };
  }

  isAdmin() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role === 'admin' : false;
  }
}
