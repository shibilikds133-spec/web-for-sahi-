import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUnitDashboard, useAllUnits } from '../../core/hooks/useUnitDashboard';
import { DashboardTabs } from './index';

export default function UnitAnalyticsDashboard() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const { data: units } = useAllUnits();
  const { data: dashData, isLoading } = useUnitDashboard(selectedUnitId);

  // Grade Counts
  const gradeCounts = {
    'A+': 0, 'A': 0, 'B': 0, 'C': 0
  };
  
  // Rank Counts
  const rankCounts = {
    '1': 0, '2': 0, '3': 0
  };

  dashData?.results.forEach((res: any) => {
    if (res.grade && gradeCounts.hasOwnProperty(res.grade)) {
      gradeCounts[res.grade as keyof typeof gradeCounts]++;
    }
    if (res.rank && rankCounts.hasOwnProperty(res.rank.toString())) {
      rankCounts[res.rank.toString() as keyof typeof rankCounts]++;
    }
  });

  // Participation Analysis
  const uniqueItemsParticipated = new Set(dashData?.registrations.map((r: any) => r.item_id)).size;
  // Note: Finding total items without participants requires querying the items table which isn't in our dashboard hook yet.
  // For now, we will show "Items Participated" and a generic placeholder for total items if not available,
  // or we can just display the distinct items participated.

  return (
    <View className="flex-1 bg-[#030E21]">
      {/* Header */}
      <View className="bg-[#0B1F33] pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm mb-6">
        <Text className="text-white text-3xl font-poppins-bold">Analytics</Text>
        <Text className="text-emerald-400 text-base font-poppins mt-1">Published Performance</Text>
      </View>

      <DashboardTabs activeTab="analytics" />

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
          <View className="gap-6 pb-20">
            
            {/* Grade Summary */}
            <View className="bg-[#0B1F33] rounded-3xl p-6 shadow-sm border border-white/10">
              <Text className="text-white text-lg font-poppins-bold mb-4">Grade Summary</Text>
              <View className="flex-row justify-between">
                <GradeCircle grade="A+" count={gradeCounts['A+']} color="bg-emerald-500" />
                <GradeCircle grade="A" count={gradeCounts['A']} color="bg-teal-500" />
                <GradeCircle grade="B" count={gradeCounts['B']} color="bg-emerald-500/50" />
                <GradeCircle grade="C" count={gradeCounts['C']} color="bg-blue-500" />
              </View>
            </View>

            {/* Rank Summary */}
            <View className="bg-[#0B1F33] rounded-3xl p-6 shadow-sm border border-white/10">
              <Text className="text-white text-lg font-poppins-bold mb-4">Rank Summary</Text>
              <View className="flex-row justify-around">
                <RankTrophy rank="1" count={rankCounts['1']} color="text-amber-500" />
                <RankTrophy rank="2" count={rankCounts['2']} color="text-white/40" />
                <RankTrophy rank="3" count={rankCounts['3']} color="text-amber-400" />
              </View>
            </View>

            {/* Participation Insight */}
            <View className="bg-[#0B1F33] rounded-3xl p-6 shadow-sm">
              <Text className="text-white text-lg font-poppins-bold mb-2">Participation Insight</Text>
              <Text className="text-emerald-400 font-poppins mb-4">You have participants registered in {uniqueItemsParticipated} unique items.</Text>
              <View className="bg-[#0B1F33]/20 p-4 rounded-2xl">
                <Text className="text-white font-poppins-bold text-center text-xl">{uniqueItemsParticipated} Active Items</Text>
              </View>
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}

const GradeCircle = ({ grade, count, color }: any) => (
  <View className="items-center">
    <View className={`w-14 h-14 rounded-full ${color} items-center justify-center mb-2 shadow-sm`}>
      <Text className="text-white text-xl font-poppins-bold">{grade}</Text>
    </View>
    <Text className="text-white/70 font-poppins-bold text-lg">{count}</Text>
  </View>
);

const RankTrophy = ({ rank, count, color }: any) => (
  <View className="items-center bg-[#0B1F33] p-4 rounded-2xl border border-white/10 min-w-[80px]">
    <Text className={`text-2xl font-poppins-bold mb-1 ${color}`}>#{rank}</Text>
    <Text className="text-white/70 font-poppins-bold text-lg">{count}</Text>
  </View>
);
