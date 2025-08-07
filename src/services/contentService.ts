import { supabase } from '@/lib/supabase';
import type { Content } from '@/lib/types';

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
