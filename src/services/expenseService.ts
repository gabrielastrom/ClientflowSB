import { supabase } from '@/lib/supabase';
import type { Expense } from '@/lib/types';

const TABLE = 'expenses';

export function listenToExpenses(callback: (expenses: Expense[]) => void): () => void {
  const channel = supabase
    .channel('public:expenses')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const { data } = await supabase.from(TABLE).select('*');
      const sorted = (data ?? []).sort((a: Expense, b: Expense) => {
        const dateA = new Date(`1 ${a.month}`);
        const dateB = new Date(`1 ${b.month}`);
        return dateB.getTime() - dateA.getTime();
      });
      callback(sorted);
    })
    .subscribe();

  supabase
    .from(TABLE)
    .select('*')
    .then(({ data }: { data: Expense[] | null }) => {
      const sorted = (data ?? []).sort((a: Expense, b: Expense) => {
        const dateA = new Date(`1 ${a.month}`);
        const dateB = new Date(`1 ${b.month}`);
        return dateB.getTime() - dateA.getTime();
      });
      callback(sorted);
    });

  return () => supabase.removeChannel(channel);
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(expense)
    .select()
    .single();
  if (error) {
    console.error('Error adding expense: ', error);
    throw new Error('Failed to add expense.');
  }
  return data!;
}

export async function updateExpense(expense: Expense): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(expense)
    .eq('id', expense.id);
  if (error) {
    console.error('Error updating expense: ', error);
    throw new Error('Failed to update expense.');
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', expenseId);
  if (error) {
    console.error('Error deleting expense: ', error);
    throw new Error('Failed to delete expense.');
  }
}
