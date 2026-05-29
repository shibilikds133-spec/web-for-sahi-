import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUnitDashboard, useAllUnits } from '../../core/hooks/useUnitDashboard';
import { DashboardTabs } from './index';

export default function UnitAttendanceDashboard() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  const { data: units } = useAllUnits();
  const { data: dashData, isLoading } = useUnitDashboard(selectedUnitId);

  // Compute attendance stats
  const totalRegistrations = dashData?.registrations.length || 0;
  const absents = dashData?.checkins.filter((c: any) => c.status === 'absent') || [];
  const absentCount = absents.length;
  const presentCount = dashData?.checkins.filter((c: any) => c.status === 'present' || c.status === 'checked_in').length || 0;
  const pendingCount = Math.max(0, totalRegistrations - (presentCount + absentCount));
  
  const presentPct = totalRegistrations > 0 ? (presentCount / totalRegistrations) * 100 : 0;
  const absentPct = totalRegistrations > 0 ? (absentCount / totalRegistrations) * 100 : 0;
  const pendingPct = totalRegistrations > 0 ? (pendingCount / totalRegistrations) * 100 : 0;

  // Item-wise absentees
  const absenteeByItem: Record<string, { itemName: string, participants: string[] }> = {};
  
  if (dashData) {
    absents.forEach((absentCheckin: any) => {
      const reg = dashData.registrations.find((r: any) => r.id === absentCheckin.registration_id);
      if (reg) {
        const participant = dashData.participants.find((p: any) => p.id === reg.participant_id);
        if (participant) {
          if (!absenteeByItem[reg.item_id]) {
            absenteeByItem[reg.item_id] = { itemName: reg.item_name, participants: [] };
          }
          absenteeByItem[reg.item_id].participants.push(`${participant.name} (${participant.chest_number})`);
        }
      }
    });
  }

  const absenteeList = Object.values(absenteeByItem);

  return (
    <View className="flex-1 bg-[#030E21]">
      {/* Header */}
      <View className="bg-[#0B1F33] pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm mb-6">
        <Text className="text-white text-3xl font-poppins-bold">Attendance</Text>
        <Text className="text-emerald-400 text-base font-poppins mt-1">Real-time Check-ins</Text>
      </View>

      <DashboardTabs activeTab="attendance" />

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
            
            {/* Overview Bar */}
            <View className="bg-[#0B1F33] rounded-3xl p-6 shadow-sm border border-white/10">
              <Text className="text-white text-lg font-poppins-bold mb-4">Overall Attendance</Text>
              
              <View className="h-4 flex-row rounded-full overflow-hidden mb-4">
                <View style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full" />
                <View style={{ width: `${absentPct}%` }} className="bg-rose-500 h-full" />
                <View style={{ width: `${pendingPct}%` }} className="bg-white/20 h-full" />
              </View>
              
              <View className="flex-row justify-between items-center mt-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-emerald-500" />
                  <Text className="text-white/70 font-poppins">{presentCount} Present</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-rose-500" />
                  <Text className="text-white/70 font-poppins">{absentCount} Absent</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-white/20" />
                  <Text className="text-white/70 font-poppins">{pendingCount} Pending</Text>
                </View>
              </View>
            </View>

            {/* Absentee List */}
            <View>
              <Text className="text-white text-lg font-poppins-bold mb-4 px-2">Item-wise Absentees</Text>
              {absenteeList.length === 0 ? (
                <View className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 items-center justify-center">
                  <Text className="text-emerald-400 font-poppins-bold text-lg">Great News!</Text>
                  <Text className="text-emerald-600 font-poppins mt-1">No absentees reported so far.</Text>
                </View>
              ) : (
                <View className="gap-4">
                  {absenteeList.map((item, index) => (
                    <View key={index} className="bg-[#0B1F33] rounded-2xl p-5 shadow-sm border border-white/10">
                      <Text className="text-emerald-400 font-poppins-bold text-base mb-3">{item.itemName}</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {item.participants.map((pName, pIndex) => (
                          <View key={pIndex} className="bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                            <Text className="text-rose-400 font-poppins text-sm">{pName}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}
