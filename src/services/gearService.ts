import { supabase } from '@/lib/supabase';
import type { Gear } from '@/lib/types';

export async function getGear(): Promise<Gear[]> {
    const { data, error } = await supabase
        .from('gear')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        assignedTo: item.assigned_to,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
    }));
}

export async function addGear(gear: Omit<Gear, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gear> {
    const { data, error } = await supabase
        .from('gear')
        .insert([{
            name: gear.name,
            assigned_to: gear.assignedTo,
            status: gear.status
        }])
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        assignedTo: data.assigned_to,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

export async function updateGear(gear: Gear): Promise<Gear> {
    const { data, error } = await supabase
        .from('gear')
        .update({
            name: gear.name,
            assigned_to: gear.assignedTo,
            status: gear.status
        })
        .eq('id', gear.id)
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        assignedTo: data.assigned_to,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

export async function deleteGear(id: string): Promise<void> {
    const { error, count } = await supabase
        .from('gear')
        .delete()
        .eq('id', id);

    if (error) throw error;
    
    if (count === 0) {
        throw new Error('Gear not found or could not be deleted');
    }
}