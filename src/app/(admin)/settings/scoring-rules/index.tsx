import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '../../../../core/hooks/useGoBack';
import { ArrowLeft, Plus, Settings2, Edit } from 'lucide-react-native';
import { SsfCard } from '../../../../components/ui/SsfCard';
import { useAuthStore } from '../../../../core/store/authStore';
import { scoringRuleRepository } from '../../../../lib/repositories/scoringRuleRepository';

export default function ScoringRulesList() {
  const router = useRouter();
  const goBack = useGoBack('/(admin)/settings');
  const { session } = useAuthStore();
  const tenantId = session?.user?.tenant_id;

  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await scoringRuleRepository.listRules(tenantId);
      if (error) throw error;
      setRules(data || []);
    } catch (e) {
      console.error('Error loading rules', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-ssf-bg">
      <View className="bg-ssf-primary pt-14 pb-5 px-5 rounded-b-[24px]">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={goBack} className="mr-3 p-1.5 bg-white/10 rounded-full">
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-xl font-poppins-black text-white flex-1" numberOfLines={1}>
            Scoring Rules
          </Text>
        </View>
        <Text className="text-white/70 font-poppins text-xs ml-10">
          Manage event criteria and maximum marks
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#1B6B3A" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-poppins-bold text-ssf-text text-lg">Event Rules</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/settings/scoring-rules/new' as any)}
              className="flex-row items-center bg-ssf-primary/10 px-3 py-1.5 rounded-full"
            >
              <Plus size={16} color="#1B6B3A" />
              <Text className="font-poppins-bold text-ssf-primary text-xs ml-1">Add Custom</Text>
            </TouchableOpacity>
          </View>

          {rules.map((rule) => (
            <SsfCard key={rule.id} className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-1 pr-2">
                  <Text className="font-poppins-bold text-ssf-text text-base">
                    {rule.event_name}
                  </Text>
                  {rule.event_name_ml && (
                    <Text className="font-poppins text-ssf-text-muted text-xs">
                      {rule.event_name_ml}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/settings/scoring-rules/${rule.id}` as any)}
                  className="p-2 bg-gray-50 rounded-full"
                >
                  <Edit size={18} color="#1B6B3A" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center gap-x-3 mt-1">
                <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-md">
                  <Text className="font-poppins-bold text-gray-700 text-xs">Total: {rule.total_marks}</Text>
                </View>
                {rule.time_limit && (
                  <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-md">
                    <Text className="font-poppins text-gray-600 text-xs">{rule.time_limit}</Text>
                  </View>
                )}
                {rule.is_default && (
                  <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-md">
                    <Text className="font-poppins-bold text-blue-600 text-xs">Default Rule</Text>
                  </View>
                )}
                {rule.tenant_id && (
                  <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded-md">
                    <Text className="font-poppins-bold text-orange-600 text-xs">Custom</Text>
                  </View>
                )}
              </View>
              
              <View className="mt-3 bg-gray-50 p-2 rounded-lg">
                <Text className="font-poppins-bold text-xs text-gray-500 mb-1">
                  Criteria ({rule.scoring_criteria?.length || 0})
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {rule.scoring_criteria?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((c: any) => (
                    <Text key={c.id} className="font-poppins text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {c.name}: {c.marks}
                    </Text>
                  ))}
                </View>
              </View>
            </SsfCard>
          ))}
          <View className="h-20" />
        </ScrollView>
      )}
    </View>
  );
}
