import { createServerSupabase } from '@/lib/supabase/server';
import type { ExpeditionTemplate, ExpeditionWithStops } from './expedition.types';

export async function getAllExpeditions(): Promise<ExpeditionTemplate[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from('expedition_templates')
        .select('*')
        .order('title');

    if (error) throw error;
    return data || [];
}

export async function getExpeditionBySlug(slug: string): Promise<ExpeditionWithStops | null> {
    const supabase = await createServerSupabase();

    const { data: template, error } = await supabase
        .from('expedition_templates')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !template) return null;

    const { data: stops } = await supabase
        .from('expedition_stops')
        .select('*')
        .eq('expedition_id', template.id)
        .order('stop_order');

    const stopsWithAccom = [];
    for (const stop of (stops || [])) {
        const { data: accommodations } = await supabase
            .from('expedition_accommodations')
            .select('*')
            .eq('stop_id', stop.id)
            .order('price_per_night');

        stopsWithAccom.push({ ...stop, accommodations: accommodations || [] });
    }

    return { ...template, stops: stopsWithAccom };
}
