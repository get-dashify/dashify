import { fetchBlockedWebRequests } from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { formatNumber } from '@/lib/format'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useGlobalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { Text, View } from 'react-native'

export default function SiteFirewallCard() {
    const { siteId } = useGlobalSearchParams<{ siteId: string }>()

    const blockedWebRequestsQuery = useQuery({
        queryKey: ['site', siteId, 'blocked-web-requests'],
        queryFn: () => fetchBlockedWebRequests({ siteId }),
    })

    const allowed = useMemo(
        () =>
            blockedWebRequestsQuery.data?.reduce((acc, curr) => acc + curr.values.allowed || 0, 0),
        [blockedWebRequestsQuery.data]
    )

    const blocked_waf = useMemo(
        () =>
            blockedWebRequestsQuery.data?.reduce(
                (acc, curr) => acc + curr.values.blocked_waf || 0,
                0
            ),
        [blockedWebRequestsQuery.data]
    )

    const blocked_firewall_traffic_rules = useMemo(
        () =>
            blockedWebRequestsQuery.data?.reduce(
                (acc, curr) => acc + curr.values.blocked_firewall_traffic_rules || 0,
                0
            ),
        [blockedWebRequestsQuery.data]
    )

    const blocked_ratelimiting_traffic_rules = useMemo(
        () =>
            blockedWebRequestsQuery.data?.reduce(
                (acc, curr) => acc + curr.values.blocked_ratelimiting_traffic_rules || 0,
                0
            ),
        [blockedWebRequestsQuery.data]
    )

    if (blockedWebRequestsQuery.isLoading) {
        return (
            <View
                style={{
                    width: '100%',
                    height: 120,
                    flexDirection: 'column',
                    backgroundColor: COLORS.bgLight,
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.text }}>Firewall</Text>
                <ActivityIndicator size="small" />
            </View>
        )
    }

    if (blockedWebRequestsQuery.isError) {
        return (
            <View
                style={{
                    width: '100%',
                    height: 120,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: COLORS.bgLight,
                    borderRadius: 10,
                    padding: 12,
                }}
            >
                <Text style={{ fontSize: 14, color: COLORS.red500 }}>
                    Error fetching firewall metrics or rules.
                </Text>
            </View>
        )
    }

    return (
        <View
            style={{
                width: '100%',
                height: 120,
                backgroundColor: COLORS.bgLight,
                borderRadius: 10,
                padding: 12,
                flexDirection: 'column',
                gap: 10,
            }}
        >
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: COLORS.text }}>Firewall</Text>

                <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={COLORS.teal500}
                    style={{ marginBottom: 2 }}
                />
            </View>

            <View
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>
                        {allowed ? formatNumber(allowed) : '—'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.green500 }}>
                        Allowed
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>
                        {blocked_waf ? formatNumber(blocked_waf) : '—'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.gold500 }}>
                        WAF
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>
                        {blocked_firewall_traffic_rules
                            ? formatNumber(blocked_firewall_traffic_rules)
                            : '—'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.red500 }}>
                        Firewall
                    </Text>
                </View>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>
                        {blocked_ratelimiting_traffic_rules
                            ? formatNumber(blocked_ratelimiting_traffic_rules)
                            : '—'}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.red500 }}>
                        Rate Limit
                    </Text>
                </View>
            </View>
        </View>
    )
}
