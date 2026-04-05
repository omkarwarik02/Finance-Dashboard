import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../core/services/app-state.service';
import { InrPipe } from '../../shared/pipes/inr.pipe';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, InrPipe],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightsComponent implements AfterViewInit, OnDestroy {
  state = inject(AppStateService);

  @ViewChild('lineChart') lineRef!: ElementRef<HTMLCanvasElement>;
  private lineChart?: Chart;

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

  get totalExpenses() { return this.state.totalExpenses(); }

  get topCategory() {
    return this.state.spendingByCategory()[0] || null;
  }

  get topCategoryPct() {
    if (this.totalExpenses === 0 || !this.topCategory) return 0;
    return Math.round((this.topCategory.amount / this.totalExpenses) * 100);
  }

  get bestMonth() {
    const data = [...this.state.monthlyData()].sort((a, b) => b.income - a.income);
    if (!data[0]) return null;
    const [year, month] = data[0].month.split('-');
    const label = new Date(+year, +month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    return { label, income: data[0].income };
  }

  get avgExpense() {
    const data = this.state.monthlyData();
    if (data.length === 0) return 0;
    const total = data.reduce((acc, m) => acc + m.expense, 0);
    return Math.round(total / data.length);
  }

  get savingsMessage() {
    const rate = this.state.savingsRate();
    if (rate >= 30) return 'Excellent! You are building wealth fast.';
    if (rate >= 20) return 'Good! You are on the right track.';
    if (rate >= 10) return 'Fair. Try to reduce discretionary spending.';
    return 'Action required. Expenses are almost matching income.';
  }

  get observations() {
    const obs = [];
    const spending = this.state.spendingByCategory();
    
    if (spending.some(s => s.category === 'Food & Dining' && s.amount > this.avgExpense * 0.3)) {
      obs.push({ emoji: '🍕', text: 'Dining expenses are high this month. Consolidate home cooking to save.' });
    }
    if (this.state.savingsRate() < 10) {
      obs.push({ emoji: '⚠️', text: 'Your savings rate is below the recommended 20%. Review your fixed costs.' });
    }
    if (this.state.totalIncome() > 100000) {
      obs.push({ emoji: '✨', text: 'High income month detected! Consider increasing your investment allocations.' });
    }
    if (this.state.allTransactions().length > 0) {
      obs.push({ emoji: '📅', text: 'Consistency is key. Keep logging to see long-term financial trends.' });
    }
    return obs;
  }

  getCategoryColor(cat: string) { return this.categoryColors[cat] || '#6b7194'; }

  ngAfterViewInit() {
    setTimeout(() => this.buildChart(), 100);
  }

  buildChart() {
    const monthly = this.state.monthlyData();
    const labels = monthly.map(m => {
      const [year, month] = m.month.split('-');
      return new Date(+year, +month-1).toLocaleString('default', { month: 'short' });
    });

    if (this.lineRef?.nativeElement) {
      this.lineChart = new Chart(this.lineRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Income',
              data: monthly.map(m => m.income),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3,
            },
            {
              label: 'Expenses',
              data: monthly.map(m => m.expense),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 3,
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#6b7194', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#6b7194', font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: '#6b7194', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  ngOnDestroy() {
    this.lineChart?.destroy();
  }
}
