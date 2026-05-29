import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

export const useUnitDashboard = (unitId: string | null | undefined) => {
  const { tenant_id } = useAuthStore();

  const fetchDashboardData = async () => {
    if (!tenant_id) throw new Error('Tenant ID is required');

    let unitFilter = unitId ? `eq.organisation_id.${unitId}` : 'not.is.null.organisation_id';

    // 1. Fetch Participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, chest_number, category_code, organisation_id')
      .eq('tenant_id', tenant_id)
      .or(unitId ? `organisation_id.eq.${unitId}` : `organisation_id.not.is.null`);

    if (participantsError) throw participantsError;

    // 2. Fetch Registrations (with checkin status if possible, we will just fetch all registrations for these participants)
    const pIds = participantsData?.map(p => p.id) || [];
    
    // Fallback if no participants
    if (pIds.length === 0) {
      return {
        participants: [],
        registrations: [],
        results: [],
        checkins: []
      };
    }

    const { data: regsData, error: regsError } = await supabase
      .from('registrations')
      .select('id, participant_id, item_id, item_name, is_group, status')
      .in('participant_id', pIds);

    if (regsError) throw regsError;

    // 3. Fetch Results strictly where public_visible = true
    const { data: resultsData, error: resultsError } = await supabase
      .from('results')
      .select('id, participant_id, registration_id, item_id, grade, rank, points, public_visible')
      .in('participant_id', pIds)
      .eq('public_visible', true);

    if (resultsError) throw resultsError;

    // 4. Fetch Checkins
    const regIds = regsData?.map(r => r.id) || [];
    let checkinsData: any[] = [];
    if (regIds.length > 0) {
      const { data: cData, error: cError } = await supabase
        .from('checkins')
        .select('id, registration_id, status')
        .in('registration_id', regIds);
      if (!cError) checkinsData = cData || [];
    }

    return {
      participants: participantsData || [],
      registrations: regsData || [],
      results: resultsData || [],
      checkins: checkinsData || []
    };
  };

  return useQuery({
    queryKey: ['unitDashboard', tenant_id, unitId],
    queryFn: fetchDashboardData,
    enabled: !!tenant_id,
    refetchInterval: 30000, // Real-time feel
  });
};

export const useAllUnits = () => {
  const { tenant_id } = useAuthStore();
  
  return useQuery({
    queryKey: ['allUnits', tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('tenant_id', tenant_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!tenant_id,
  });
};
