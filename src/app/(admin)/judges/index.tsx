import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Clipboard, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, Trash2, UserCheck, Phone, Key, Copy, Share2 } from 'lucide-react-native';
import { SsfCard } from '../../../components/ui/SsfCard';
import { SsfButton } from '../../../components/ui/SsfButton';
import { SsfInput } from '../../../components/ui/SsfInput';
import { useJudges } from '../../../core/hooks/useJudges';
import { useAuthStore } from '../../../core/store/authStore';
import { judgeTokenService } from '../../../services/judgeTokenService';
import { useSchedule } from '../../../core/hooks/useSchedule';

export default function JudgesPage() {
  const router = useRouter();
  const { user, tenant_id } = useAuthStore();
  const { judges, isLoadingJudges, createJudge, deleteJudge } = useJudges();
  const { schedules } = useSchedule();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', specialization: '' });
  const [selectedJudgeForToken, setSelectedJudgeForToken] = useState<any>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Judge name is required');
      return;
    }
    try {
      await createJudge.mutateAsync({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        specialization: form.specialization
          ? form.specialization.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      });
      setForm({ name: '', phone: '', specialization: '' });
      setIsAddModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Judge', `Remove "${name}" from the panel?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJudge.mutate(id) },
    ]);
  };

  const openTokenModal = (judge: any) => {
    setSelectedJudgeForToken(judge);
    setGeneratedToken(null);
    setSelectedScheduleId('');
    setIsTokenModalOpen(true);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateToken = async () => {
    setErrorMessage(null);
    console.log('[Token Gen] Button clicked. Selected Schedule:', selectedScheduleId);

    if (!selectedScheduleId) {
      setErrorMessage('Please select an event for this judge.');
      return;
    }
    if (!selectedJudgeForToken?.id) {
      setErrorMessage('No judge selected. Please try again.');
      return;
    }
    if (!tenant_id) {
      setErrorMessage('Session error: tenant_id is missing. Please logout and login again.');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[Token Gen] Payload:', {
        judgeId: selectedJudgeForToken.id,
        scheduleId: selectedScheduleId,
        tenantId: tenant_id,
        createdBy: user?.id ?? 'unknown',
      });

      const result = await judgeTokenService.generateToken({
        judgeId: selectedJudgeForToken.id,
        scheduleId: selectedScheduleId,
        tenantId: tenant_id,
        createdBy: user?.id ?? '',
      });

      console.log('[Token Gen] Result:', result);

      const tokenString = typeof result === 'string' ? result : result?.token;

      if (!tokenString) {
        setErrorMessage('Token was not returned from server. Check Supabase logs.');
        return;
      }

      setGeneratedToken(tokenString);
    } catch (e: any) {
      console.error('[Token Gen] Error:', e);
      setErrorMessage(e.message ?? 'Unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };


  const copyToken = () => {
    if (generatedToken) {
      Clipboard.setString(generatedToken);
      Alert.alert('Copied!', 'Access code copied to clipboard.');
    }
  };

  const shareToken = async () => {
    if (generatedToken && selectedJudgeForToken) {
      const schedule = schedules?.find((s: any) => s.id === selectedScheduleId);
      await Share.share({
        message: `السلام عليكم ${selectedJudgeForToken.name},\n\nYour judge access code for "${schedule?.items?.item_name_ml ?? 'the event'}" is:\n\n🔑 ${generatedToken}\n\nVisit the Judge Portal to enter marks.\n\nThis code is for single use only.`,
      });
    }
  };

  return (
    <View className="flex-1 bg-ssf-bg">
      <LinearGradient
        colors={['#065F46', '#044230']}
        style={{ paddingTop: 56, paddingBottom: 40, paddingHorizontal: 24, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, marginBottom: 16 }}
      >
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(admin)/schedule' as any)} className="mr-3 p-2 bg-white/10 rounded-full">
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-poppins-black text-white">Judge Panel</Text>
        </View>
        <Text className="text-white/70 font-poppins text-sm">
          {judges.length} judge{judges.length !== 1 ? 's' : ''} registered
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {isLoadingJudges ? (
          <ActivityIndicator color="#1B6B3A" style={{ marginTop: 40 }} />
        ) : judges.length === 0 ? (
          <SsfCard className="items-center py-10">
            <UserCheck size={48} color="#D1D5DB" />
            <Text className="font-poppins-bold text-ssf-text-muted mt-3">No judges added yet</Text>
            <Text className="font-poppins text-ssf-text-muted text-sm text-center mt-1">
              Add judges who will evaluate participants
            </Text>
          </SsfCard>
        ) : (
          <View className="gap-y-3 mb-24">
            {judges.map((judge: any) => (
              <SsfCard key={judge.id}>
                <View className="flex-row items-center mb-3">
                  {/* Avatar */}
                  <View className="w-12 h-12 rounded-2xl bg-ssf-primary/10 items-center justify-center mr-3">
                    <Text className="font-poppins-black text-ssf-primary text-lg">
                      {judge.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  {/* Info */}
                  <View className="flex-1">
                    <Text className="font-poppins-bold text-ssf-text text-base">{judge.name}</Text>
                    {judge.phone && (
                      <View className="flex-row items-center gap-x-1 mt-0.5">
                        <Phone size={11} color="#6B7280" />
                        <Text className="font-poppins text-xs text-ssf-text-muted">{judge.phone}</Text>
                      </View>
                    )}
                    {judge.specialization?.length > 0 && (
                      <Text className="font-poppins text-xs text-ssf-primary mt-0.5">
                        {judge.specialization.join(', ')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(judge.id, judge.name)} className="p-2">
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Generate Access Code button */}
                <TouchableOpacity
                  onPress={() => openTokenModal(judge)}
                  className="flex-row items-center justify-center gap-x-2 bg-ssf-primary/10 border border-ssf-primary/20 rounded-xl py-2.5 px-4"
                >
                  <Key size={14} color="#1B6B3A" />
                  <Text className="font-poppins-bold text-ssf-primary text-sm">Generate Access Code</Text>
                </TouchableOpacity>
              </SsfCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-8 right-5">
        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          className="bg-ssf-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Plus size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ── Add Judge Modal ── */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white p-6 rounded-t-3xl">
            <Text className="text-xl font-poppins-black text-ssf-text mb-5">Add Judge</Text>
            <SsfInput label="Full Name *" placeholder="e.g., Abdul Rahman" value={form.name} onChangeText={v => setForm({ ...form, name: v })} className="mb-4" />
            <SsfInput label="Phone Number" placeholder="e.g., 9876543210" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} className="mb-4" />
            <SsfInput label="Specialization (comma-separated)" placeholder="e.g., Mappilappattu, Elocution" value={form.specialization} onChangeText={v => setForm({ ...form, specialization: v })} className="mb-6" />
            <SsfButton label="Add Judge" onPress={handleSave} isLoading={createJudge.isPending} className="mb-3" />
            <SsfButton label="Cancel" variant="outline" onPress={() => { setForm({ name: '', phone: '', specialization: '' }); setIsAddModalOpen(false); }} />
          </View>
        </View>
      </Modal>

      {/* ── Generate Token Modal ── */}
      <Modal visible={isTokenModalOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white p-6 rounded-t-3xl">
            <Text className="text-xl font-poppins-black text-ssf-text mb-1">
              Access Code
            </Text>
            <Text className="font-poppins text-ssf-text-muted text-sm mb-5">
              For: {selectedJudgeForToken?.name}
            </Text>

            {!generatedToken ? (
              <>
                {/* Schedule selector */}
                <Text className="font-poppins-bold text-ssf-text mb-2">Select Event *</Text>
                <ScrollView style={{ maxHeight: 200 }} className="mb-4">
                  {(schedules as any[])?.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSelectedScheduleId(s.id)}
                      className={`px-4 py-3 rounded-xl mb-2 border ${
                        selectedScheduleId === s.id
                          ? 'bg-ssf-primary/10 border-ssf-primary'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`font-poppins-bold text-sm ${
                        selectedScheduleId === s.id ? 'text-ssf-primary' : 'text-ssf-text'
                      }`}>
                        {s.items?.item_name_ml ?? s.items?.item_name_en ?? 'Unknown'}
                      </Text>
                      <Text className="font-poppins text-xs text-ssf-text-muted mt-0.5">
                        {s.venues?.name} · {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {errorMessage && (
                  <View className="bg-red-50 p-3 rounded-xl mb-3 border border-red-100">
                    <Text className="font-poppins text-red-600 text-sm">{errorMessage}</Text>
                  </View>
                )}

                <SsfButton
                  label="🔑 Generate One-Time Code"
                  onPress={handleGenerateToken}
                  isLoading={isGenerating}
                  disabled={!selectedScheduleId}
                  className="mb-3"
                />
                <SsfButton label="Cancel" variant="outline" onPress={() => setIsTokenModalOpen(false)} />
              </>
            ) : (
              <>
                {/* Show generated token */}
                <View className="bg-gray-50 rounded-2xl p-5 items-center mb-5 border border-gray-200">
                  <Text className="font-poppins text-gray-500 text-xs mb-2">One-Time Access Code</Text>
                  <Text className="font-poppins-black text-4xl text-ssf-primary tracking-widest mb-2">
                    {generatedToken}
                  </Text>
                  <Text className="font-poppins text-gray-400 text-xs text-center">
                    Share this code with the judge.{'\n'}It expires after single use.
                  </Text>
                </View>

                <View className="flex-row gap-x-3 mb-3">
                  <TouchableOpacity
                    onPress={copyToken}
                    className="flex-1 flex-row items-center justify-center gap-x-2 bg-gray-100 rounded-xl py-3"
                  >
                    <Copy size={16} color="#374151" />
                    <Text className="font-poppins-bold text-gray-700 text-sm">Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={shareToken}
                    className="flex-1 flex-row items-center justify-center gap-x-2 bg-ssf-primary rounded-xl py-3"
                  >
                    <Share2 size={16} color="#FFF" />
                    <Text className="font-poppins-bold text-white text-sm">Share</Text>
                  </TouchableOpacity>
                </View>

                <SsfButton label="Done" variant="outline" onPress={() => setIsTokenModalOpen(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
