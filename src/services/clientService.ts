import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/types';

const TABLE = 'client';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from(TABLE).select('*');
  if (error) {
    console.error('Error fetching clients: ', error);
    throw new Error('Could not fetch clients from the database.');
  }
  // Map snake_case fields to camelCase for frontend
  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    contactPerson: c.contactperson,
    email: c.email,
    phone: c.phone,
    status: c.status,
    joinDate: c.joindate,
    monthlyVideos: c.monthlyvideos,
    documentation: c.documentation,
  }));
}

function toDbClient(client: any) {
  return {
    name: client.name,
    contactperson: client.contactPerson,
    email: client.email,
    phone: client.phone,
    status: client.status,
    joindate: client.joinDate,
    monthlyvideos: client.monthlyVideos,
    documentation: client.documentation,
    id: client.id,
  };
}

function fromDbClient(c: any): Client {
  return {
    id: c.id,
    name: c.name,
    contactPerson: c.contactperson,
    email: c.email,
    phone: c.phone,
    status: c.status,
    joinDate: c.joindate,
    monthlyVideos: c.monthlyvideos,
    documentation: c.documentation,
  };
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  const dbClient = toDbClient(client);
  delete dbClient.id;
  const { data, error } = await supabase
    .from(TABLE)
    .insert(dbClient)
    .select()
    .single();
  if (error) {
    console.error('Error adding client: ', error);
    throw new Error('Failed to add client.');
  }
  return fromDbClient(data);
}

export async function updateClient(client: Client): Promise<void> {
  const dbClient = toDbClient(client);
  const { error } = await supabase
    .from(TABLE)
    .update(dbClient)
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
