import { fetchSite, fetchSiteEnvVars } from '@/api/queries'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import { router, useGlobalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const CONTEXT_LABELS: Record<string, string> = {
    all: 'All',
    dev: 'Development',
    'branch-deploy': 'Branch Deploy',
    'deploy-preview': 'Deploy Preview',
    production: 'Production',
}

export default function SiteEnvScreen() {
    const { siteId } = useGlobalSearchParams<{ siteId: string }>()
    const navigation = useNavigation()

    const siteQuery = useQuery({
        queryKey: ['sites', siteId],
        queryFn: () => fetchSite({ id: siteId }),
    })

    const envVarsQuery = useQuery({
        queryKey: ['sites', siteId, 'env'],
        queryFn: () =>
            fetchSiteEnvVars({
                siteId,
                accountId: siteQuery.data?.account_id!,
            }),
        enabled: !!siteId && !!siteQuery.data?.account_id,
    })

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: envVarsQuery.isLoading,
            hasData: (envVarsQuery.data?.length || 0) > 0,
            isError: envVarsQuery.isError,
            emptyLabel: 'No environment variables',
            errorLabel: 'Failed to fetch environment variables',
        })
    }, [envVarsQuery.isLoading, envVarsQuery.data, envVarsQuery.isError])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: 'Environment',
            headerRight: () => (
                <HeaderTouchableOpacity
                    onPress={() => {
                        router.push(`/sites/${siteId}/env/add`)
                    }}
                >
                    <Ionicons
                        name={isLiquidGlassAvailable() ? 'add' : 'add-circle'}
                        size={36}
                        color={COLORS.teal}
                    />
                </HeaderTouchableOpacity>
            ),
        })
    }, [navigation, siteId])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={<RefreshControl onRefresh={envVarsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={envVarsQuery.data || []}
            overrideProps={overrideProps}
            ListEmptyComponent={Placeholder}
            renderItem={({ item: envVar, index }) => {
                const contexts = envVar.values?.map((v) => v.context).filter(Boolean) || []
                const uniqueContexts = [...new Set(contexts)]

                return (
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            router.push(
                                `/sites/${siteId}/env/${encodeURIComponent(envVar.key || '')}`
                            )
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: index % 2 === 0 ? COLORS.bgDarker : undefined,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 16,
                                gap: 12,
                            }}
                        >
                            <View style={{ flexDirection: 'column', gap: 4, flex: 1 }}>
                                <Text
                                    style={{
                                        color: COLORS.text,
                                        fontSize: 16,
                                        fontWeight: '600',
                                    }}
                                    numberOfLines={1}
                                >
                                    {envVar.key}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
                                        {uniqueContexts.length === 0
                                            ? 'No contexts'
                                            : uniqueContexts
                                                  .map((ctx) => CONTEXT_LABELS[ctx] || ctx)
                                                  .join(', ')}
                                    </Text>
                                    {envVar.is_secret && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <Ionicons
                                                name="lock-closed"
                                                size={12}
                                                color={COLORS.textMuted}
                                            />
                                            <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
                                                Secret
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </View>
                    </TouchableOpacity>
                )
            }}
        />
    )
}
