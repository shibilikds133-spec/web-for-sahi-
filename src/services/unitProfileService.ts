import { supabase } from '../core/config/supabase';

export type UnitParticipantRow = {
  id: string;
  name: string;
  chest_number: string;
  category_code: string;
  profile_slug: string | null;
  status: string;
  photo_url: string | null;
  registrations: {
    id: string;
    status: string;
    is_present: boolean | null;
    item_id: string;
    item: {
      name: string;
      name_ml: string | null;
    };
    results: {
      rank: number | null;
      grade: string | null;
      points_awarded: number;
    }[];
  }[];
};

export type UnitProfileData = {
  id: string;
  name: string;
  parent_id: string | null;
  participants: UnitParticipantRow[];
  stats: {
    totalParticipants: number;
    totalRegistrations: number;
    totalPresent: number;
    totalAbsent: number;
    totalPending: number;
  };
};

const throwIfError = (error: { message: string } | null, dataError?: string) => {
  if (error) throw new Error(error.message);
  if (dataError) throw new Error(dataError);
};

export const unitProfileService = {
  async getUnitProfile(unitId: string): Promise<UnitProfileData | null> {
    // Fetch organization info
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .select('id, name, parent_id')
      .eq('id', unitId)
      .single();

    if (orgError) {
      if (orgError.code === 'PGRST116') return null; // Not found
      throwIfError(orgError);
    }

    // Fetch participants with their registrations and results
    const { data: participantsData, error: partsError } = await supabase
      .from('participants')
      .select(`
        id, name, chest_number, category_code, profile_slug, status, photo_url,
        registrations (
          id, status, is_present, item_id,
          item:items (name, name_ml),
          results (rank, grade, points_awarded)
        )
      `)
      .eq('organisation_id', unitId);

    throwIfError(partsError);

    const participants = (participantsData || []) as any[];

    let totalRegistrations = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalPending = 0;

    participants.forEach((p) => {
      p.registrations = p.registrations || [];
      p.registrations.forEach((r: any) => {
        totalRegistrations++;
        if (r.is_present === true) totalPresent++;
        else if (r.is_present === false) totalAbsent++;
        else totalPending++;
      });
    });

    return {
      id: orgData.id,
      name: orgData.name,
      parent_id: orgData.parent_id,
      participants: participants as UnitParticipantRow[],
      stats: {
        totalParticipants: participants.length,
        totalRegistrations,
        totalPresent,
        totalAbsent,
        totalPending,
      },
    };
  },
};
