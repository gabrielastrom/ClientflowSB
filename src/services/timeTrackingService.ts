import { supabase } from '@/lib/supabase';
import type { TimeEntry } from '@/lib/types';

const TABLE = 'time_entry';

export async function getTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('Error fetching time entries: ', error);
    throw new Error('Could not fetch time entries.');
  }
  return (data ?? [])
    .filter((entry: any) => entry.date)
    .map((entry: any) => ({
      id: entry.id,
      date: entry.date,
      teamMember: entry.name, // map DB field "name" to UI field "teamMember"
      client: entry.client,
      task: entry.task,
      duration: entry.duration,
    }))
    .sort((a: TimeEntry, b: TimeEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
}



// Accepts { date, name, client, task, duration }
export async function addTimeEntry(entry: any): Promise<TimeEntry> {
  const dbEntry = {
    date: entry.date,
    name: entry.name,
    client: entry.client,
    task: entry.task,
    duration: entry.duration,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(dbEntry)
    .select()
    .single();
  if (error) {
    console.error('Error adding time entry: ', error);
    throw new Error('Failed to add time entry.');
  }
  // Patch: return as TimeEntry shape for UI
  return {
    id: data.id,
    date: data.date,
    teamMember: data.name,
    client: data.client,
    task: data.task,
    duration: data.duration,
  };
}



// Accepts { id, date, name, client, task, duration }
export async function updateTimeEntry(entry: any): Promise<void> {
  const dbEntry = {
    date: entry.date,
    name: entry.name,
    client: entry.client,
    task: entry.task,
    duration: entry.duration,
  };
  const { error } = await supabase
    .from(TABLE)
    .update(dbEntry)
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
