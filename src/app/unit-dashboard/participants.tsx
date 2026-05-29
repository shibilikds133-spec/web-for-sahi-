import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useUnitDashboard, useAllUnits } from '../../core/hooks/useUnitDashboard';
import { DashboardTabs } from './index';

export default function UnitParticipantsDirectory() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  
  const { data: units } = useAllUnits();
  const { data: dashData, isLoading } = useUnitDashboard(selectedUnitId);

  // Filter participants
  const filteredParticipants = dashData?.participants.filter((p: any) => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.chest_number?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getParticipantDetails = (pId: string) => {
    if (!dashData) return null;
    const regs = dashData.registrations.filter((r: any) => r.participant_id === pId);
    const regIds = regs.map((r: any) => r.id);
    const checks = dashData.checkins.filter((c: any) => regIds.includes(c.registration_id));
    const res = dashData.results.filter((r: any) => r.participant_id === pId);
    
    return { regs, checks, res };
  };

  return (
    <View className="flex-1 bg-[#030E21]">
      {/* Header */}
      <View className="bg-[#0B1F33] pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm mb-6">
        <Text className="text-white text-3xl font-poppins-bold">Directory</Text>
        <Text className="text-emerald-400 text-base font-poppins mt-1">Participant Profiles</Text>
      </View>

      <DashboardTabs activeTab="participants" />

      {/* Unit & Search */}
      <View className="px-6 mb-4 gap-4">
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

        <TextInput
          className="bg-[#0B1F33] rounded-2xl px-5 py-4 font-poppins text-white border border-white/10 shadow-sm"
          placeholder="Search name or chest number..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView className="flex-1 px-6">
        {isLoading ? (
          <ActivityIndicator size="large" color="#10B981" className="mt-20" />
        ) : (
          <View className="gap-3 pb-20">
            {filteredParticipants.map((p: any) => {
              const details = getParticipantDetails(p.id);
              const totalRegs = details?.regs.length || 0;
              const absents = details?.checks.filter((c: any) => c.status === 'absent').length || 0;
              const totalPoints = details?.res.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0) || 0;

              return (
                <TouchableOpacity 
                  key={p.id}
                  onPress={() => setSelectedParticipant({ ...p, ...details })}
                  className="bg-[#0B1F33] p-5 rounded-3xl border border-white/10 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-white font-poppins-bold text-lg">{p.name}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="bg-[#0B1F33]/10 px-2 py-0.5 rounded-md">
                        <Text className="text-emerald-400 text-xs font-poppins-bold">{p.chest_number}</Text>
                      </View>
                      <Text className="text-white/40 text-xs font-poppins">• {p.category_code}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-emerald-400 text-xs font-poppins-bold bg-[#0B1F33]/5 px-2 py-1 rounded-lg">
                      {totalRegs} Items
                    </Text>
                    {absents > 0 && (
                      <Text className="text-rose-500 text-xs font-poppins">{absents} Absent</Text>
                    )}
                    {totalPoints > 0 && (
                      <Text className="text-emerald-500 text-xs font-poppins-bold">{totalPoints} Pts</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={!!selectedParticipant} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-[#0B1F33]">
          <View className="bg-[#0B1F33] pt-16 pb-6 px-6">
            <Text className="text-white text-2xl font-poppins-bold">{selectedParticipant?.name}</Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-[#0B1F33]/20 px-3 py-1 rounded-full">
                <Text className="text-white text-sm font-poppins-bold">{selectedParticipant?.chest_number}</Text>
              </View>
              <Text className="text-emerald-400 text-sm font-poppins">{selectedParticipant?.category_code}</Text>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            <Text className="text-white text-lg font-poppins-bold mb-4">Participation History</Text>
            
            {selectedParticipant?.regs?.map((reg: any) => {
              const checkin = selectedParticipant.checks?.find((c: any) => c.registration_id === reg.id);
              const result = selectedParticipant.res?.find((r: any) => r.registration_id === reg.id);

              return (
                <View key={reg.id} className="bg-[#0B1F33] p-4 rounded-2xl mb-3 border border-white/10">
                  <Text className="text-white font-poppins-bold">{reg.item_name}</Text>
                  
                  <View className="flex-row gap-2 mt-3">
                    <View className={`px-2 py-1 rounded-md ${checkin?.status === 'absent' ? 'bg-rose-500/20' : checkin?.status === 'present' ? 'bg-emerald-500/20' : 'bg-white/20'}`}>
                      <Text className={`text-xs font-poppins-bold ${checkin?.status === 'absent' ? 'text-rose-400' : checkin?.status === 'present' ? 'text-emerald-400' : 'text-white/70'}`}>
                        {checkin?.status === 'absent' ? 'Absent' : checkin?.status === 'present' ? 'Present' : 'Pending Check-in'}
                      </Text>
                    </View>

                    {result?.public_visible && (
                      <>
                        {result.grade && (
                          <View className="bg-amber-500/20 px-2 py-1 rounded-md">
                            <Text className="text-amber-400 text-xs font-poppins-bold">Grade {result.grade}</Text>
                          </View>
                        )}
                        {result.rank && (
                          <View className="bg-blue-500/20 px-2 py-1 rounded-md">
                            <Text className="text-blue-400 text-xs font-poppins-bold">Rank {result.rank}</Text>
                          </View>
                        )}
                        {result.points > 0 && (
                          <View className="bg-emerald-500/20 px-2 py-1 rounded-md">
                            <Text className="text-emerald-400 text-xs font-poppins-bold">{result.points} Pts</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })}

            <TouchableOpacity 
              onPress={() => setSelectedParticipant(null)}
              className="bg-white/10 p-4 rounded-2xl items-center mt-6 mb-10"
            >
              <Text className="text-white/70 font-poppins">Close Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
