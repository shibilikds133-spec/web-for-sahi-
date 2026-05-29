import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUnitDashboard, useAllUnits } from '../../core/hooks/useUnitDashboard';

// Shared Tabs Component
export const DashboardTabs = ({ activeTab }: { activeTab: string }) => {
  const router = useRouter();
  const tabs = [
    { key: 'overview', label: 'Overview', route: '/unit-dashboard' },
    { key: 'participants', label: 'Directory', route: '/unit-dashboard/participants' },
    { key: 'attendance', label: 'Attendance', route: '/unit-dashboard/attendance' },
    { key: 'analytics', label: 'Analytics', route: '/unit-dashboard/analytics' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 border-b border-white/10 pb-2">
      <View className="flex-row items-center gap-4 px-4">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => router.replace(tab.route as any)}
            className={`px-4 py-2 rounded-full ${activeTab === tab.key ? 'bg-[#10B981]' : 'bg-[#0B1F33] border border-white/10'}`}
          >
            <Text className={`font-poppins-bold ${activeTab === tab.key ? 'text-white' : 'text-white/70'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default function UnitDashboardOverview() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const { data: units, isLoading: unitsLoading } = useAllUnits();
  const { data: dashData, isLoading } = useUnitDashboard(selectedUnitId);

  // Compute stats
  const totalParticipants = dashData?.participants.length || 0;
  const totalRegistrations = dashData?.registrations.length || 0;
  const uniqueItems = new Set(dashData?.registrations.map((r: any) => r.item_id)).size;
  const totalPublishedResults = dashData?.results.length || 0;
  const totalPublishedPoints = dashData?.results.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0) || 0;

  const totalCheckins = dashData?.checkins.length || 0;
  const absentCount = dashData?.checkins.filter((c: any) => c.status === 'absent').length || 0;
  const presentCount = dashData?.checkins.filter((c: any) => c.status === 'present' || c.status === 'checked_in').length || 0;
  const attendancePct = totalRegistrations > 0 ? Math.round(((presentCount + absentCount) > 0 ? (presentCount / (presentCount + absentCount)) : 0) * 100) : 0;

  return (
    <View className="flex-1 bg-[#030E21]">
      {/* Header */}
      <View className="bg-[#0B1F33] pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm mb-6">
        <Text className="text-white text-3xl font-poppins-bold">Unit Performance</Text>
        <Text className="text-emerald-400 text-base font-poppins mt-1">Real-time Public Analytics</Text>
      </View>

      <DashboardTabs activeTab="overview" />

      {/* Unit Selector */}
      <View className="px-6 mb-6">
        <View className="bg-[#0B1F33] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
          <Picker
            selectedValue={selectedUnitId || ''}
            onValueChange={(val) => setSelectedUnitId(val === '' ? null : val)}
            style={{ height: 50, color: '#FFFFFF' }}
          >
            <Picker.Item label="All Units Overview" value="" />
            {units?.map((u: any) => (
              <Picker.Item key={u.id} label={u.name} value={u.id} />
            ))}
          </Picker>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {isLoading ? (
          <ActivityIndicator size="large" color="#10B981" className="mt-20" />
        ) : (
          <View className="gap-4 pb-20">
            {/* Live Progress Tracker */}
            <View className="bg-[#0B1F33] rounded-3xl p-6 shadow-sm border border-white/10">
              <Text className="text-white text-lg font-poppins-bold mb-4">Live Progress Tracker</Text>
              <View className="flex-row justify-between items-end">
                <View>
                  <Text className="text-white/60 text-sm font-poppins">Total Reg</Text>
                  <Text className="text-white text-2xl font-poppins-bold">{totalRegistrations}</Text>
                </View>
                <View>
                  <Text className="text-emerald-400 text-sm font-poppins">Published</Text>
                  <Text className="text-emerald-400 text-2xl font-poppins-bold">{totalPublishedResults}</Text>
                </View>
                <View>
                  <Text className="text-amber-500 text-sm font-poppins">Pending</Text>
                  <Text className="text-amber-500 text-2xl font-poppins-bold">{Math.max(0, totalRegistrations - totalPublishedResults)}</Text>
                </View>
              </View>
            </View>

            {/* Main Stats Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-4">
              <StatCard title="Participants" value={totalParticipants} />
              <StatCard title="Items Participated" value={uniqueItems} />
              <StatCard title="Published Points" value={totalPublishedPoints} highlight />
              <StatCard title="Attendance" value={`${attendancePct}%`} />
              <StatCard title="Absent Count" value={absentCount} />
              <StatCard title="Current Rank" value="--" sub="Leaderboard" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const StatCard = ({ title, value, highlight = false, sub }: any) => (
  <View className={`w-full sm:w-[48%] rounded-3xl p-5 shadow-sm border ${highlight ? 'bg-[#0B1F33] border-white/100' : 'bg-[#0B1F33] border-white/10'}`}>
    <Text className={`${highlight ? 'text-emerald-400' : 'text-white/60'} text-xs font-poppins mb-1`}>{title}</Text>
    <Text className={`${highlight ? 'text-white' : 'text-white'} text-3xl font-poppins-bold`}>{value}</Text>
    {sub && <Text className="text-white/40 text-xs font-poppins mt-1">{sub}</Text>}
  </View>
);
