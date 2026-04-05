import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/services/app-state.service';
import { Transaction, Category } from '../../core/models/transaction.model';
import { InrPipe } from '../../shared/pipes/inr.pipe';
import { TransactionModalComponent } from '../../shared/components/transaction-modal.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, TransactionModalComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsComponent {
  state = inject(AppStateService);

  showModal = false;
  editingTransaction: Transaction | null = null;

  categories: Category[] = [
    'Salary', 'Freelance', 'Investment', 'Food & Dining', 
    'Transport', 'Shopping', 'Entertainment', 'Health', 
    'Housing', 'Utilities', 'Other'
  ];

  onSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.state.updateFilters({ search: val });
  }

  setType(type: 'all' | 'income' | 'expense') {
    this.state.updateFilters({ type });
  }

  onCategory(e: Event) {
    const val = (e.target as HTMLSelectElement).value as 'all' | Category;
    this.state.updateFilters({ category: val });
  }

  clearFilters() {
    this.state.updateFilters({ search: '', type: 'all', category: 'all' });
  }

  openAdd() {
    this.editingTransaction = null;
    this.showModal = true;
  }

  openEdit(t: Transaction) {
    this.editingTransaction = { ...t };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingTransaction = null;
  }

  onSave(txn: any) {
    if (this.editingTransaction) {
      this.state.editTransaction(txn);
    } else {
      this.state.addTransaction(txn);
    }
    this.closeModal();
  }
}
