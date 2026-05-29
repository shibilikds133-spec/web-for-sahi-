import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Rocket,
  ShieldCheck,
} from 'lucide-react-native';
import { useAdminLeaderboard } from '../../../../core/hooks/useAdminLeaderboard';
import { useFestival } from '../../../../core/hooks/useFestival';
import {
  useGetLeaderboardSettings,
  useUpdateLeaderboardSettings,
} from '../../../../core/hooks/useLeaderboardSettings';
import { useAuthStore } from '../../../../core/store/authStore';
import { LeaderboardRow } from '../../../../services/leaderboardService';
import { LeaderboardSettings } from '../../../../services/leaderboardSettingsService';

const colors = {
  navy: '#0B1F3A',
  blue: '#123B73',
  cyan: '#16B8D9',
  teal: '#0F766E',
  green: '#22C55E',
  bg: '#F3F8FB',
  card: '#FFFFFF',
  border: '#DDEAF1',
  text: '#0F172A',
  muted: '#64748B',
  soft: '#EAF7FA',
};

const rankPalette = ['#F59E0B', '#94A3B8', '#B45309'];

type UiLeaderboardRow = LeaderboardRow & {
  district: string;
  movement: number;
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return 'Awaiting first publish';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getDistrictLabel = (row: LeaderboardRow) => {
  if (row.organisation_type?.toLowerCase().includes('district')) return row.organisation_name;
  return 'Sahithyolsav District';
};

const RankBadge = ({ rank }: { rank: number }) => {
  const isTop = rank <= 3;
  return (
    <View
      style={[
        styles.rankBadge,
        isTop && { backgroundColor: `${rankPalette[rank - 1]}18`, borderColor: rankPalette[rank - 1] },
      ]}
    >
      <Text style={[styles.rankBadgeText, isTop && { color: rankPalette[rank - 1] }]}>#{rank}</Text>
    </View>
  );
};

export default function UnitRankingsPage() {
  const { tenant_id } = useAuthStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1180;
  const isMobile = width < 760;

  // Load active festival ID
  const { useActiveFestival } = useFestival();
  const { data: activeFestival, isLoading: isFestivalLoading } = useActiveFestival();
  const festivalId = activeFestival?.id;

  // Load database settings
  const { data: settings, isLoading: isSettingsLoading } = useGetLeaderboardSettings(festivalId);
  const updateSettingsMutation = useUpdateLeaderboardSettings(tenant_id ?? '', festivalId ?? '');

  // Local settings states (Applied on clicking "Apply Settings")
  const [isPublicVisible, setIsPublicVisible] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(300);
  const [showRankMovement, setShowRankMovement] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showGradeSummary, setShowGradeSummary] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [previewVisibility, setPreviewVisibility] = useState('draft');
  const [posterEnabled, setPosterEnabled] = useState(true);
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [posterTopCount, setPosterTopCount] = useState(3);
  const [showIndividualRankings, setShowIndividualRankings] = useState(true);

  // Sync state with db loaded settings
  React.useEffect(() => {
    if (settings) {
      setIsPublicVisible(settings.is_public_visible);
      setAutoRefreshEnabled(settings.auto_refresh_enabled);
      setAutoRefreshInterval(settings.auto_refresh_interval);
      setShowRankMovement(settings.show_rank_movement);
      setShowTimestamps(settings.show_timestamps);
      setShowGradeSummary(settings.show_grade_summary);
      setIsFrozen(settings.is_frozen);
      setPreviewVisibility(settings.preview_visibility || 'draft');
      setPosterEnabled(settings.poster_enabled);
      setCertificateEnabled(settings.certificate_enabled);
      setPosterTopCount(settings.poster_top_count || 3);
      setShowIndividualRankings(settings.show_individual_rankings ?? true);
    }
  }, [settings]);

  const buildSettingsPayload = (
    overrides: Partial<LeaderboardSettings> = {},
  ): Partial<LeaderboardSettings> => ({
    is_public_visible: isPublicVisible,
    auto_refresh_enabled: autoRefreshEnabled,
    auto_refresh_interval: autoRefreshInterval,
    show_rank_movement: showRankMovement,
    show_timestamps: showTimestamps,
    show_grade_summary: showGradeSummary,
    is_frozen: isFrozen,
    preview_visibility: previewVisibility,
    poster_enabled: posterEnabled,
    certificate_enabled: certificateEnabled,
    poster_top_count: posterTopCount,
    show_individual_rankings: showIndividualRankings,
    ...overrides,
  });

  const handleApplySettings = async () => {
    if (!tenant_id || !festivalId) {
      alert('Active festival or tenant not found.');
      return;
    }
    try {
      await updateSettingsMutation.mutateAsync(buildSettingsPayload());
      alert('Settings applied successfully!');
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
    }
  };

  const persistSetting = async (payload: Partial<LeaderboardSettings>) => {
    if (!tenant_id || !festivalId) {
      alert('Active festival or tenant not found.');
      return false;
    }
    try {
      await updateSettingsMutation.mutateAsync(buildSettingsPayload(payload));
      return true;
    } catch (err: any) {
      alert('Error updating settings: ' + err.message);
      return false;
    }
  };

  const { data = [], isLoading: isLeaderboardLoading, isRefetching, refetch } = useAdminLeaderboard(tenant_id, festivalId);

  const isLoading = isLeaderboardLoading || isFestivalLoading || isSettingsLoading;

  const rows = useMemo<UiLeaderboardRow[]>(() => {
    return data.map((row, index) => ({
      ...row,
      district: getDistrictLabel(row),
      movement: 0,
    }));
  }, [data]);

  const latestUpdate = rows.reduce<string | null>((latest, row) => {
    if (!row.latest_published_at) return latest;
    if (!latest || new Date(row.latest_published_at) > new Date(latest)) return row.latest_published_at;
    return latest;
  }, null);

  const renderTable = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.loadingText}>Loading leaderboard control data</Text>
        </View>
      );
    }

    if (isMobile) {
      return (
        <View style={{ gap: 12 }}>
          {rows.map((row, index) => (
            <View key={row.organisation_id ?? row.organisation_name} style={styles.mobileRowCard}>
              <View style={styles.mobileRowHeader}>
                <RankBadge rank={index + 1} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.unitName}>{row.organisation_name}</Text>
                  <Text style={styles.unitMeta}>{row.district}</Text>
                </View>
                <Text style={styles.pointsValue}>{formatNumber(row.total_points)}</Text>
              </View>
              <View style={styles.mobileRowFooter}>
                <Text style={styles.mobileStat}>{row.first_place_count} wins</Text>
                <Text style={styles.mobileStat}>{row.result_count} events</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.7 }]}>Rank</Text>
          <Text style={[styles.th, { flex: 2.2 }]}>Unit</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>District</Text>
          <Text style={[styles.th, { flex: 1.1 }]}>Events Won</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Total Points</Text>
          <Text style={[styles.th, { flex: 0.5, textAlign: 'right' }]} />
        </View>
        {rows.map((row, index) => (
          <View key={row.organisation_id ?? row.organisation_name} style={styles.tableRow}>
            <View style={{ flex: 0.7 }}>
              <RankBadge rank={index + 1} />
            </View>
            <View style={{ flex: 2.2 }}>
              <Text style={styles.unitName}>{row.organisation_name}</Text>
              <Text style={styles.unitMeta}>{row.result_count} counted results</Text>
            </View>
            <Text style={[styles.td, { flex: 1.5 }]}>{row.district}</Text>
            <Text style={[styles.tdStrong, { flex: 1.1 }]}>{row.first_place_count}</Text>
            <Text style={[styles.pointsValue, { flex: 1.2, textAlign: 'right' }]}>
              {formatNumber(row.total_points)}
            </Text>
            <TouchableOpacity style={{ flex: 0.5, alignItems: 'flex-end' }}>
              <MoreHorizontal size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.workbench, !isDesktop && styles.workbenchStacked]}>
        <View style={styles.tableCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Unit Rankings</Text>
              <Text style={styles.cardSubTitle}>
                Published team/unit scores, ordered by total points.
              </Text>
            </View>
            <TouchableOpacity onPress={() => refetch()} style={styles.secondaryAction}>
              <RefreshCw size={16} color={colors.teal} />
              {!isMobile && (
                <Text style={styles.secondaryActionText}>
                  {isRefetching ? 'Refreshing' : 'Refresh'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {renderTable()}
        </View>

        <View style={[styles.controlPanel, !isDesktop && styles.controlPanelWide]}>
          <Text style={styles.controlTitle}>Leaderboard Control</Text>
          <Text style={styles.controlSub}>Manage live ranking publication behavior.</Text>

          <View style={styles.controlList}>
            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Public Visibility</Text>
                <Text style={styles.controlHint}>Show leaderboard to the public</Text>
              </View>
              <Switch
                value={isPublicVisible}
                onValueChange={async (value) => {
                  const previous = isPublicVisible;
                  setIsPublicVisible(value);
                  const saved = await persistSetting({ is_public_visible: value });
                  if (!saved) setIsPublicVisible(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                thumbColor={isPublicVisible ? colors.teal : '#FFFFFF'}
              />
            </View>

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Individual Rankings</Text>
                <Text style={styles.controlHint}>Show individual rankings on the public leaderboard</Text>
              </View>
              <Switch
                value={showIndividualRankings}
                onValueChange={async (value) => {
                  const previous = showIndividualRankings;
                  setShowIndividualRankings(value);
                  const saved = await persistSetting({ show_individual_rankings: value });
                  if (!saved) setShowIndividualRankings(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
                thumbColor={showIndividualRankings ? colors.cyan : '#FFFFFF'}
              />
            </View>

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Auto Refresh</Text>
                <Text style={styles.controlHint}>Refresh rankings automatically</Text>
              </View>
              <Switch
                value={autoRefreshEnabled}
                onValueChange={async (value) => {
                  const previous = autoRefreshEnabled;
                  setAutoRefreshEnabled(value);
                  const saved = await persistSetting({ auto_refresh_enabled: value });
                  if (!saved) setAutoRefreshEnabled(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
                thumbColor={autoRefreshEnabled ? colors.cyan : '#FFFFFF'}
              />
            </View>

            {autoRefreshEnabled && (
              <TouchableOpacity 
                onPress={() => {
                  const nextInterval = autoRefreshInterval === 60 ? 300 : autoRefreshInterval === 300 ? 900 : 60;
                  setAutoRefreshInterval(nextInterval);
                }}
                style={styles.dropdown}
              >
                <View>
                  <Text style={styles.controlHint}>Refresh interval</Text>
                  <Text style={styles.dropdownValue}>
                    {autoRefreshInterval >= 60 ? `Every ${autoRefreshInterval / 60} minutes` : `Every ${autoRefreshInterval} seconds`}
                  </Text>
                </View>
                <ChevronDown size={18} color={colors.muted} />
              </TouchableOpacity>
            )}

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Freeze Leaderboard</Text>
                <Text style={styles.controlHint}>Freeze rankings to pause movement</Text>
              </View>
              <Switch
                value={isFrozen}
                onValueChange={async (value) => {
                  const previous = isFrozen;
                  setIsFrozen(value);
                  const saved = await persistSetting({ is_frozen: value });
                  if (!saved) setIsFrozen(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#FCA5A5' }}
                thumbColor={isFrozen ? '#EF4444' : '#FFFFFF'}
              />
            </View>

            <TouchableOpacity 
              onPress={() => {
                setPreviewVisibility(previewVisibility === 'draft' ? 'public' : 'draft');
              }}
              style={styles.dropdown}
            >
              <View>
                <Text style={styles.controlHint}>Preview Mode</Text>
                <Text style={styles.dropdownValue}>{previewVisibility === 'draft' ? 'Draft Only' : 'Public Access'}</Text>
              </View>
              <ChevronDown size={18} color={colors.muted} />
            </TouchableOpacity>

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Show Timestamps</Text>
                <Text style={styles.controlHint}>Display latest update time</Text>
              </View>
              <Switch
                value={showTimestamps}
                onValueChange={async (value) => {
                  const previous = showTimestamps;
                  setShowTimestamps(value);
                  const saved = await persistSetting({ show_timestamps: value });
                  if (!saved) setShowTimestamps(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                thumbColor={showTimestamps ? colors.teal : '#FFFFFF'}
              />
            </View>

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Grade Summary</Text>
                <Text style={styles.controlHint}>Display overall grades count</Text>
              </View>
              <Switch
                value={showGradeSummary}
                onValueChange={async (value) => {
                  const previous = showGradeSummary;
                  setShowGradeSummary(value);
                  const saved = await persistSetting({ show_grade_summary: value });
                  if (!saved) setShowGradeSummary(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                thumbColor={showGradeSummary ? colors.teal : '#FFFFFF'}
              />
            </View>

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Poster Generation</Text>
                <Text style={styles.controlHint}>Allow poster downloads for units</Text>
              </View>
              <Switch
                value={posterEnabled}
                onValueChange={async (value) => {
                  const previous = posterEnabled;
                  setPosterEnabled(value);
                  const saved = await persistSetting({ poster_enabled: value });
                  if (!saved) setPosterEnabled(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                thumbColor={posterEnabled ? colors.teal : '#FFFFFF'}
              />
            </View>

            {posterEnabled && (
              <TouchableOpacity 
                onPress={() => {
                  const nextCount = posterTopCount === 3 ? 5 : posterTopCount === 5 ? 10 : 3;
                  setPosterTopCount(nextCount);
                }}
                style={styles.dropdown}
              >
                <View>
                  <Text style={styles.controlHint}>Poster Top Rank Limit</Text>
                  <Text style={styles.dropdownValue}>Top {posterTopCount} Units</Text>
                </View>
                <ChevronDown size={18} color={colors.muted} />
              </TouchableOpacity>
            )}

            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Certificate Generation</Text>
                <Text style={styles.controlHint}>Allow winners certificates</Text>
              </View>
              <Switch
                value={certificateEnabled}
                onValueChange={async (value) => {
                  const previous = certificateEnabled;
                  setCertificateEnabled(value);
                  const saved = await persistSetting({ certificate_enabled: value });
                  if (!saved) setCertificateEnabled(previous);
                }}
                disabled={updateSettingsMutation.isPending}
                trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
                thumbColor={certificateEnabled ? colors.teal : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={styles.actionBlock}>
            <Text style={styles.blockTitle}>Settings Actions</Text>
            <TouchableOpacity 
              onPress={handleApplySettings} 
              style={[styles.primaryAction, updateSettingsMutation.isPending && { opacity: 0.7 }]}
              disabled={updateSettingsMutation.isPending}
            >
              <Rocket size={17} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {updateSettingsMutation.isPending ? 'Applying...' : 'Apply Settings'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.blockTitle, { marginTop: 12 }]}>Manual Actions</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.outlineAction}>
              <RefreshCw size={17} color={colors.teal} />
              <Text style={styles.outlineActionText}>
                {isRefetching ? 'Recalculating...' : 'Recalculate Rankings'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBlock}>
            <Text style={styles.blockTitle}>Data Summary</Text>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Source</Text>
              <Text style={styles.summaryValue}>Published results</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Visibility</Text>
              <Text style={styles.summaryValue}>{isPublicVisible ? 'Live' : 'Paused'}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Last update</Text>
              <Text style={styles.summaryValue}>{formatDateTime(latestUpdate)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoStrip}>
        <View style={styles.infoIcon}>
          <ShieldCheck size={18} color={colors.teal} />
        </View>
        <Text style={styles.infoText}>
          Leaderboard management displays unit/team rankings only. Individual participant
          points are not exposed in this control panel.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    paddingVertical: 46,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: 10,
  },
  workbench: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
    width: '100%',
  },
  workbenchStacked: {
    flexDirection: 'column',
  },
  tableCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#0F2A45',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: 'Poppins_900Black',
    fontSize: 20,
  },
  cardSubTitle: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  secondaryAction: {
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F8FCFD',
  },
  secondaryActionText: {
    color: colors.teal,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  tableHeader: {
    minHeight: 44,
    backgroundColor: '#F6FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  th: {
    color: colors.muted,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tableRow: {
    minHeight: 74,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF5F8',
  },
  rankBadge: {
    alignSelf: 'flex-start',
    minWidth: 46,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E5EC',
    backgroundColor: '#F8FCFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: colors.navy,
    fontFamily: 'Poppins_900Black',
    fontSize: 13,
  },
  unitName: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  unitMeta: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  td: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  tdStrong: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  pointsValue: {
    color: colors.blue,
    fontFamily: 'Poppins_900Black',
    fontSize: 18,
  },
  changePill: {
    minWidth: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  changePillText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 12,
  },
  mobileRowCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  mobileRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileRowFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF5F8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileStat: {
    color: colors.muted,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  controlPanel: {
    width: 320,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: '#0F2A45',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  controlPanelWide: {
    width: '100%',
  },
  controlTitle: {
    color: colors.text,
    fontFamily: 'Poppins_900Black',
    fontSize: 18,
  },
  controlSub: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  controlList: {
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF5F8',
  },
  controlLabel: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  controlHint: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    marginBottom: 6,
  },
  dropdownValue: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    marginTop: 2,
  },
  actionBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  blockTitle: {
    color: colors.muted,
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  primaryAction: {
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.teal,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  outlineAction: {
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineActionText: {
    color: colors.teal,
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  summaryBlock: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  infoStrip: {
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(22,184,217,0.18)',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    color: '#0F5868',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
