import { supabase } from '@/lib/supabase';
import type { TeamMember } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

const TABLE = 'team';

export function listenToTeamMembers(callback: (team: TeamMember[]) => void): () => void {
  const channel = supabase
    .channel('public:team')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const { data } = await supabase.from(TABLE).select('*');
      callback(data ?? []);
    })
    .subscribe();

  supabase
    .from(TABLE)
    .select('*')
    .then(({ data }: { data: TeamMember[] | null }) => callback(data ?? []));

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function upsertTeamMemberFromUser(user: User): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
      email: user.email || '',
      phone: user.phone || '',
      role: 'Kreatör',
      assignedClients: [],
      hourlyRate: 150,
      photoURL: user.user_metadata?.avatar_url || '',
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error upserting team member: ', error);
    throw new Error('Failed to upsert team member.');
  }
}

export async function updateTeamMember(teamMember: TeamMember): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update(teamMember)
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
