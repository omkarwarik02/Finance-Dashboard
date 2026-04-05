import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction, Category } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-modal.component.html',
  styleUrl: './transaction-modal.component.scss'
})
export class TransactionModalComponent implements OnInit {
  @Input() transaction: Transaction | null = null;
  @Output() save = new EventEmitter<Transaction | Omit<Transaction, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  form: any = {
    description: '',
    amount: null,
    date: new Date().toISOString().substring(0, 10),
    type: 'expense',
    category: 'Food & Dining'
  };

  error = '';

  categories: Category[] = [
    'Salary', 'Freelance', 'Investment', 'Food & Dining', 
    'Transport', 'Shopping', 'Entertainment', 'Health', 
    'Housing', 'Utilities', 'Other'
  ];

  ngOnInit() {
    if (this.transaction) {
      this.form = { ...this.transaction };
    }
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.cancel.emit();
    }
  }

  submit() {
    this.error = '';
    if (!this.form.description || !this.form.description.trim()) {
      this.error = 'Description is required';
      return;
    }
    if (!this.form.amount || this.form.amount <= 0) {
      this.error = 'Enter a valid amount';
      return;
    }
    if (!this.form.date) {
      this.error = 'Date is required';
      return;
    }

    this.save.emit(this.form);
  }
}
