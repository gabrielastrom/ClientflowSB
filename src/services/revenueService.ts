import { supabase } from '@/lib/supabase';
import type { Revenue } from '@/lib/types';

const TABLE = 'revenues';

export function listenToRevenues(callback: (revenues: Revenue[]) => void): () => void {
  const channel = supabase
    .channel('public:revenues')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const { data } = await supabase.from(TABLE).select('*');
      const sorted = (data ?? []).sort((a: Revenue, b: Revenue) => {
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
    .then(({ data }: { data: Revenue[] | null }) => {
      const sorted = (data ?? []).sort((a: Revenue, b: Revenue) => {
        const dateA = new Date(`1 ${a.month}`);
        const dateB = new Date(`1 ${b.month}`);
        return dateB.getTime() - dateA.getTime();
      });
      callback(sorted);
    });

  return () => supabase.removeChannel(channel);
}

export async function addRevenue(revenue: Omit<Revenue, 'id'>): Promise<Revenue> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(revenue)
    .select()
    .single();
  if (error) {
    console.error('Error adding revenue: ', error);
    throw new Error('Failed to add revenue.');
  }
  return data!;
}

export async function updateRevenue(revenue: Revenue): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(revenue)
    .eq('id', revenue.id);
  if (error) {
    console.error('Error updating revenue: ', error);
    throw new Error('Failed to update revenue.');
  }
}

export async function deleteRevenue(revenueId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', revenueId);
  if (error) {
    console.error('Error deleting revenue: ', error);
    throw new Error('Failed to delete revenue.');
  }
}
