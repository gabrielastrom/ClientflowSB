import { supabase } from '@/lib/supabase';
import type { Trip } from '@/lib/types';

export async function addTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
    const { data, error } = await supabase
        .from('trips')
        .insert([{
            start_location: trip.startLocation,
            destination: trip.destination,
            distance: trip.distance,
            team_member: trip.teamMember,
            date: trip.date,
            purpose: trip.purpose
        }])
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        startLocation: data.start_location,
        destination: data.destination,
        distance: data.distance,
        teamMember: data.team_member,
        date: data.date,
        purpose: data.purpose
    };
}

export async function getTrips(): Promise<Trip[]> {
    const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map((trip: any) => ({
        id: trip.id,
        startLocation: trip.start_location,
        destination: trip.destination,
        distance: trip.distance,
        teamMember: trip.team_member,
        date: trip.date,
        purpose: trip.purpose
    }));
}

export async function updateTrip(trip: Trip): Promise<Trip> {
    const { data, error } = await supabase
        .from('trips')
        .update({
            start_location: trip.startLocation,
            destination: trip.destination,
            distance: trip.distance,
            team_member: trip.teamMember,
            date: trip.date,
            purpose: trip.purpose
        })
        .eq('id', trip.id)
        .select()
        .single();

    if (error) throw error;
    return {
        id: data.id,
        startLocation: data.start_location,
        destination: data.destination,
        distance: data.distance,
        teamMember: data.team_member,
        date: data.date,
        purpose: data.purpose
    };
}

export async function deleteTrip(id: string): Promise<void> {
    const { error, count } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

    if (error) throw error;
    
    // If no rows were affected, throw an error
    if (count === 0) {
        throw new Error('Trip not found or could not be deleted');
    }
}