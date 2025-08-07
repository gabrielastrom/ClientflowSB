import { supabase } from '@/lib/supabase';
import type { TimeEntry } from '@/lib/types';

const TABLE = 'time-entries';

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('Error fetching time entries: ', error);
    throw new Error('Could not fetch time entries.');
  }
  return (data ?? [])
    .filter((entry: TimeEntry) => entry.date)
    .sort(
      (a: TimeEntry, b: TimeEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export async function addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(entry)
    .select()
    .single();
  if (error) {
    console.error('Error adding time entry: ', error);
    throw new Error('Failed to add time entry.');
  }
  return data!;
}

export async function updateTimeEntry(entry: TimeEntry): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(entry)
    .eq('id', entry.id);
  if (error) {
    console.error('Error updating time entry: ', error);
    throw new Error('Failed to update time entry.');
  }
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', entryId);
  if (error) {
    console.error('Error deleting time entry: ', error);
    throw new Error('Failed to delete time entry.');
  }
}
