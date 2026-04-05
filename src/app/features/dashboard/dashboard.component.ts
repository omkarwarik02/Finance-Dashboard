import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../core/services/app-state.service';
import { InrPipe } from '../../shared/pipes/inr.pipe';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, InrPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  state = inject(AppStateService);

  @ViewChild('barChart') barRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutRef!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart;
  private doughnutChart?: Chart;

  private categoryColors: Record<string, string> = {
    'Salary': '#34d399',
    'Freelance': '#60a5fa',
    'Investment': '#fbbf24',
    'Food & Dining': '#f0b429',
    'Transport': '#3b82f6',
    'Shopping': '#a78bfa',
    'Entertainment': '#f472b6',
    'Health': '#22c55e',
    'Housing': '#ef4444',
    'Utilities': '#fb923c',
    'Other': '#6b7194',
  };

  get incomeCount() {
    return this.state.allTransactions().filter(t => t.type === 'income').length;
  }
  get expenseCount() {
    return this.state.allTransactions().filter(t => t.type === 'expense').length;
  }

  getCategoryColor(cat: string): string {
    return this.categoryColors[cat] ?? '#6b7194';
  }

  ngAfterViewInit() {
    // Delay slightly to ensure signals are settled and layout is ready
    setTimeout(() => this.buildCharts(), 100);
  }

  buildCharts() {
    const monthly = this.state.monthlyData();
    const labels = monthly.map(m => {
      const [year, month] = m.month.split('-');
      return new Date(+year, +month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    if (this.barRef?.nativeElement) {
      this.barChart = new Chart(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: monthly.map(m => m.income),
              backgroundColor: 'rgba(34,197,94,0.7)',
              borderRadius: 6,
            },
            {
              label: 'Expenses',
              data: monthly.map(m => m.expense),
              backgroundColor: 'rgba(239,68,68,0.65)',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#6b7194', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: {
              ticks: {
                color: '#6b7194', font: { size: 11 },
                callback: (v: any) => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v),
              },
              grid: { color: 'rgba(255,255,255,0.05)' },
            },
          },
        },
      });
    }

    const catData = this.state.spendingByCategory().slice(0, 5);
    if (this.doughnutRef?.nativeElement && catData.length > 0) {
      this.doughnutChart = new Chart(this.doughnutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: catData.map(c => c.category),
          datasets: [{
            data: catData.map(c => c.amount),
            backgroundColor: catData.map(c => this.getCategoryColor(c.category)),
            borderWidth: 2,
            borderColor: '#181c27',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { display: false } },
        },
      });
    }
  }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
  }
}
