import { supabase } from '@/lib/supabase';
import type { TeamMember } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

const TABLE = 'team';

export function listenToTeamMembers(callback: (team: TeamMember[]) => void): () => void {
  // Helper to map Supabase row to TeamMember type
  function mapTeamMember(row: any): TeamMember {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      assignedClients: row.assignedclients || [],
      hourlyrate: row.hourlyrate,
      photoURL: row.photourl,
      notes: row.notes,
    };
  }

  const channel = supabase
    .channel('public:team')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const { data } = await supabase.from(TABLE).select('*');
      callback((data ?? []).map(mapTeamMember));
    })
    .subscribe();

  supabase
    .from(TABLE)
    .select('*')
    .then(({ data }: { data: any[] | null }) => callback((data ?? []).map(mapTeamMember)));

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function upsertTeamMemberFromUser(user: User): Promise<void> {
  // Fetch existing team member

  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select('role, hourlyrate')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // ignore "row not found"
    console.error('Error fetching team member for upsert:', fetchError);
    throw new Error('Failed to fetch team member.');
  }

  const roleToUse = existing?.role || user.user_metadata?.role || 'Kreatör';
  const hourlyRateToUse = existing?.hourlyrate ?? 150;

  const { error } = await supabase
    .from(TABLE)
    .upsert({
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
      email: user.email || '',
      phone: user.phone || '',
      role: roleToUse,
      assignedclients: [],
      hourlyrate: hourlyRateToUse,
      photourl: user.user_metadata?.avatar_url || '',
      notes: ''
    });

  if (error) {
    console.error('Error upserting team member: ', error);
    throw new Error('Failed to upsert team member.');
  }
}

export async function updateTeamMember(teamMember: TeamMember): Promise<void> {
  // Map camelCase fields to Supabase snake_case columns
  const updateObj: any = {
    id: teamMember.id,
    name: teamMember.name,
    email: teamMember.email,
    phone: teamMember.phone,
    role: teamMember.role,
    assignedclients: teamMember.assignedClients,
    hourlyrate: teamMember.hourlyrate,
    photourl: teamMember.photoURL,
    notes: teamMember.notes,
  };
  const { error } = await supabase
    .from(TABLE)
    .update(updateObj)
    .eq('id', teamMember.id);
  if (error) {
    console.error('Error updating team member: ', error);
    throw new Error('Failed to update team member.');
  }
}

export async function deleteTeamMember(teamMemberId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', teamMemberId);
  if (error) {
    console.error('Error deleting team member: ', error);
    throw new Error('Failed to delete team member.');
  }
}

export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user || userData.user.id !== userId) {
    throw new Error('Authentication error: User is not authorized to perform this action.');
  }

  const filePath = `${userId}/${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading profile picture: ', uploadError);
    throw new Error('Failed to upload profile picture.');
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);

  const { error } = await supabase
    .from(TABLE)
    .update({ photoURL: publicUrl })
    .eq('id', userId);
  if (error) {
    console.error('Error updating profile picture: ', error);
    throw new Error('Failed to upload profile picture.');
  }

  return publicUrl;
}
