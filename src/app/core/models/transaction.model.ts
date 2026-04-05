export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'Salary' 
  | 'Freelance' 
  | 'Investment' 
  | 'Food & Dining' 
  | 'Transport' 
  | 'Shopping' 
  | 'Entertainment' 
  | 'Health' 
  | 'Housing' 
  | 'Utilities' 
  | 'Other';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: Category;
}

export type AppRole = 'viewer' | 'admin';
