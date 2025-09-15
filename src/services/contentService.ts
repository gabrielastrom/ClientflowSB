import { supabase } from '@/lib/supabase';
import type { Content } from '@/lib/types';

const NOTES_TABLE = 'notes';

const TABLE = 'content';

export async function getContent(): Promise<Content[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('Error fetching content: ', error);
    throw new Error('Could not fetch content.');
  }
  return data ?? [];
}

export async function addContent(content: Omit<Content, 'id'>): Promise<Content> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(content)
    .select()
    .single();
  if (error) {
    console.error('Error adding content: ', error);
    throw new Error('Failed to add content.');
  }
  return data!;
}

export async function updateContent(content: Content): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(content)
    .eq('id', content.id);
  if (error) {
    console.error('Error updating content: ', error);
    throw new Error('Failed to update content.');
  }
}

export async function deleteContent(contentId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', contentId);
  if (error) {
    console.error('Error deleting content: ', error);
    throw new Error('Failed to delete content.');
  }
}

// User Notes functions
export async function getUserNotes(userId: string): Promise<{ notes: string } | null> {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('notes')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
    console.error('Error fetching notes:', error);
    throw new Error('Could not fetch notes.');
  }
  return data ?? null;
}

export async function saveUserNotes(userId: string, notes: string): Promise<void> {
  // Upsert notes for the user
  const { error } = await supabase
    .from(NOTES_TABLE)
    .upsert({ user_id: userId, notes })
    .eq('user_id', userId);
  if (error) {
    console.error('Error saving notes:', error);
    throw new Error('Failed to save notes.');
  }
}
