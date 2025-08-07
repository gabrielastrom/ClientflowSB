import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/types';

const TABLE = 'clients';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('Error fetching clients: ', error);
    throw new Error('Could not fetch clients from the database.');
  }
  return data ?? [];
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(client)
    .select()
    .single();
  if (error) {
    console.error('Error adding client: ', error);
    throw new Error('Failed to add client.');
  }
  return data!;
}

export async function updateClient(client: Client): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(client)
    .eq('id', client.id);
  if (error) {
    console.error('Error updating client: ', error);
    throw new Error('Failed to update client.');
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', clientId);
  if (error) {
    console.error('Error deleting client: ', error);
    throw new Error('Failed to delete client.');
  }
}
