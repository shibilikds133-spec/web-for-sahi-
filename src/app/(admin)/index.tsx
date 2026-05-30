import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SsfCard } from '../../components/ui/SsfCard';
import { SsfButton } from '../../components/ui/SsfButton';
import { useAuthStore } from '../../core/store/authStore';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminDashboard } from '../../core/hooks/useAdminDashboard';
import { Bell } from 'lucide-react-native';

export default function AdminDashboard() {
  const { logout, tenant_id } = useAuthStore();
  const router = useRouter();
  const { useStats } = useAdminDashboard();
  const { data, isLoading, isRefetching, refetch } = useStats();

  const loading = isLoading;
  const refreshing = isRefetching;
  
  const orgData = data ? { name: data.orgName, type: data.orgType } : null;
  const stats = data ? {
    participants: data.participantsCount,
    items: data.itemsCount,
    results: data.pendingRegsCount
  } : { participants: 0, items: 0, results: 0 };

  const onRefresh = () => {
    refetch();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#065F46" />
        <Text style={{ marginTop: 12, color: '#64748B', fontFamily: 'Poppins_400Regular' }}>Loading Portal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#065F46" />}
    >
      <Animated.View entering={FadeInDown.duration(800).springify()}>
        <LinearGradient
          colors={['#065F46', '#044230']}
          style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: 64, paddingBottom: 48, paddingHorizontal: 24, marginBottom: 32 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', opacity: 0.8, fontFamily: 'Poppins_700Bold', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
                {orgData?.type ?? 'ADMIN'} PORTAL
              </Text>
              <Text numberOfLines={2} style={{ color: '#fff', fontSize: 28, fontFamily: 'Poppins_900Black', lineHeight: 32, marginTop: 4 }}>
                {orgData?.name ?? 'Dashboard'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Bell size={20} color="#fff" />
              </TouchableOpacity>
              <SsfButton label="Logout" variant="outline" size="sm" style={{ borderColor: '#fff' }} onPress={logout} />
            </View>
          </View>
          <Text style={{ color: '#F8FAFC', opacity: 0.8, fontFamily: 'Poppins_400Regular', marginTop: 8 }}>Manage your festival operations</Text>
        </LinearGradient>
      </Animated.View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <Animated.View entering={FadeInUp.duration(800).delay(200).springify()} style={{ width: '47%' }}>
            <SsfCard>
              <Text style={{ color: '#64748B', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>Participants</Text>
              <Text style={{ color: '#065F46', fontSize: 32, fontFamily: 'Poppins_900Black', marginTop: 4 }}>{stats.participants}</Text>
            </SsfCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(300).springify()} style={{ width: '47%' }}>
            <SsfCard>
              <Text style={{ color: '#64748B', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>Items</Text>
              <Text style={{ color: '#B45309', fontSize: 32, fontFamily: 'Poppins_900Black', marginTop: 4 }}>{stats.items}</Text>
            </SsfCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(400).springify()} style={{ width: '47%' }}>
            <SsfCard>
              <Text style={{ color: '#64748B', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>Pending Regs</Text>
              <Text style={{ color: '#E11D48', fontSize: 32, fontFamily: 'Poppins_900Black', marginTop: 4 }}>{stats.results}</Text>
            </SsfCard>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.duration(800).delay(500).springify()}>
          <Text style={{ color: '#0F172A', fontSize: 22, fontFamily: 'Poppins_900Black', marginBottom: 20 }}>Quick Links</Text>
          <SsfCard style={{ marginBottom: 24 }}>
            <View style={{ gap: 16 }}>
              <SsfButton
                label="Manage Participants"
                variant="primary"
                onPress={() => router.push('/(admin)/participants')}
              />
              <SsfButton
                label="Manage Schedules"
                variant="outline"
                onPress={() => router.push('/(admin)/schedule' as any)}
              />
              <SsfButton
                label="Sub-Organisations"
                variant="outline"
                onPress={() => router.push('/(admin)/organisations')}
              />
              <SsfButton
                label="Festival Settings"
                variant="outline"
                onPress={() => router.push('/(admin)/settings')}
              />
              <SsfButton
                label="Communication Center"
                variant="outline"
                onPress={() => router.push('/(admin)/communication')}
              />
              <SsfButton
                label="Judge Management"
                variant="outline"
                onPress={() => router.push('/(admin)/judges' as any)}
              />
              <SsfButton
                label="Leaderboard Management"
                variant="outline"
                onPress={() => router.push('/(admin)/settings/leaderboard')}
              />
              <SsfButton
                label="📱 Open Judge Portal"
                variant="primary"
                style={{ backgroundColor: '#1B6B3A' }}
                onPress={() => router.push('/judge' as any)}
              />
            </View>
          </SsfCard>
        </Animated.View>

        {/* Graphs */}
        {data?.categoryGraph && data.categoryGraph.length > 0 && (
          <Animated.View entering={FadeInUp.duration(800).delay(450).springify()}>
            <SsfCard style={{ marginBottom: 24 }}>
              <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 16 }}>Participants by Category</Text>
              {data.categoryGraph.map((item, index) => {
                const max = Math.max(...data.categoryGraph.map(d => d.count));
                const width = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <View key={index} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#334155' }}>{item.name}</Text>
                      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#065F46' }}>{item.count}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${width}%`, height: '100%', backgroundColor: '#065F46', borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })}
            </SsfCard>
          </Animated.View>
        )}

        {data?.unitGraph && data.unitGraph.length > 0 && (
          <Animated.View entering={FadeInUp.duration(800).delay(480).springify()}>
            <SsfCard style={{ marginBottom: 24 }}>
              <Text style={{ color: '#0F172A', fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 16 }}>Participants by {orgData?.type === 'sector' ? 'Unit' : 'Sub-Organisation'}</Text>
              {data.unitGraph.slice(0, 10).map((item, index) => { // Top 10
                const max = Math.max(...data.unitGraph.map(d => d.count));
                const width = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <View key={index} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#334155' }}>{item.name}</Text>
                      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#0B6BDB' }}>{item.count}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ width: `${width}%`, height: '100%', backgroundColor: '#0B6BDB', borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })}
            </SsfCard>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}
