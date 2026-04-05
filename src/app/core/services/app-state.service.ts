import { Injectable, computed, signal, effect } from '@angular/core';
import { Transaction, AppRole, Category } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // State Signals
  allTransactions = signal<Transaction[]>([]);
  role = signal<AppRole>('admin');

  // Filters
  filters = signal<{ search: string, type: 'all' | 'income' | 'expense', category: 'all' | Category, sortBy: 'date' | 'amount', sortDir: 'asc' | 'desc' }>({
    search: '',
    type: 'all',
    category: 'all',
    sortBy: 'date',
    sortDir: 'desc'
  });

  constructor() {
    this.loadFromStorage();
    
    // Auto-save on changes
    effect(() => {
      localStorage.setItem('finIQ_txns', JSON.stringify(this.allTransactions()));
      localStorage.setItem('finIQ_role', this.role());
    });
  }

  // Computed Values
  filteredTransactions = computed(() => {
    const txns = this.allTransactions();
    const f = this.filters();

    return txns
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(f.search.toLowerCase());
        const matchesType = f.type === 'all' || t.type === f.type;
        const matchesCat = f.category === 'all' || t.category === f.category;
        return matchesSearch && matchesType && matchesCat;
      })
      .sort((a, b) => {
        const valA = f.sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
        const valB = f.sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
        return f.sortDir === 'desc' ? valB - valA : valA - valB;
      });
  });

  balance = computed(() => {
    return this.allTransactions().reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
  });

  totalIncome = computed(() => {
    return this.allTransactions().filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  });

  totalExpenses = computed(() => {
    return this.allTransactions().filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  });

  savingsRate = computed(() => {
    const income = this.totalIncome();
    if (income === 0) return 0;
    const savings = income - this.totalExpenses();
    return Math.max(0, Math.round((savings / income) * 100));
  });

  spendingByCategory = computed(() => {
    const map: Record<string, number> = {};
    this.allTransactions().filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  monthlyData = computed(() => {
    const map: Record<string, { income: number, expense: number }> = {};
    this.allTransactions().forEach(t => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!map[month]) map[month] = { income: 0, expense: 0 };
      if (t.type === 'income') map[month].income += t.amount;
      else map[month].expense += t.amount;
    });
    return Object.entries(map)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  });

  // Actions
  addTransaction(txn: Omit<Transaction, 'id'>) {
    const newTxn = { ...txn, id: crypto.randomUUID() };
    this.allTransactions.update(list => [newTxn, ...list]);
  }

  editTransaction(txn: Transaction) {
    this.allTransactions.update(list => list.map(t => t.id === txn.id ? txn : t));
  }

  deleteTransaction(id: string) {
    this.allTransactions.update(list => list.filter(t => t.id !== id));
  }

  setRole(r: AppRole) {
    this.role.set(r);
  }

  updateFilters(f: Partial<ReturnType<typeof this.filters>>) {
    this.filters.update(curr => ({ ...curr, ...f }));
  }

  toggleSort(key: 'date' | 'amount') {
    const curr = this.filters();
    if (curr.sortBy === key) {
      this.updateFilters({ sortDir: curr.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.updateFilters({ sortBy: key, sortDir: 'desc' });
    }
  }

  private loadFromStorage() {
    const txns = localStorage.getItem('finIQ_txns');
    const role = localStorage.getItem('finIQ_role');
    
    if (txns) this.allTransactions.set(JSON.parse(txns));
    else this.loadMockData(); // Initial load

    if (role) this.role.set(role as AppRole);
  }

  private loadMockData() {
    const mock: Transaction[] = [
      { id: '1', description: 'Monthly Salary', amount: 85000, date: '2026-03-01', type: 'income', category: 'Salary' },
      { id: '2', description: 'Apartment Rent', amount: 28000, date: '2026-03-02', type: 'expense', category: 'Housing' },
      { id: '3', description: 'Grocery Store', amount: 4500, date: '2026-03-05', type: 'expense', category: 'Food & Dining' },
      { id: '4', description: 'Amazon Shopping', amount: 12000, date: '2026-03-10', type: 'expense', category: 'Shopping' },
      { id: '5', description: 'Freelance Project', amount: 15000, date: '2026-03-15', type: 'income', category: 'Freelance' },
      { id: '6', description: 'Electricity Bill', amount: 3200, date: '2026-03-18', type: 'expense', category: 'Utilities' },
      { id: '7', description: 'Netflix & Spotify', amount: 1200, date: '2026-03-20', type: 'expense', category: 'Entertainment' },
      { id: '8', description: 'Gas refill', amount: 4000, date: '2026-03-22', type: 'expense', category: 'Transport' },
      { id: '9', description: 'Gym Membership', amount: 2500, date: '2026-03-25', type: 'expense', category: 'Health' },
      { id: '10', description: 'Dividend Payout', amount: 2100, date: '2026-03-28', type: 'income', category: 'Investment' },
      { id: '11', description: 'Swiggy Dinner', amount: 1800, date: '2026-03-30', type: 'expense', category: 'Food & Dining' },
      // Previous month
      { id: '101', description: 'Salary Feb', amount: 82000, date: '2026-02-01', type: 'income', category: 'Salary' },
      { id: '102', description: 'Rent Feb', amount: 28000, date: '2026-02-02', type: 'expense', category: 'Housing' },
    ];
    this.allTransactions.set(mock);
  }
}
