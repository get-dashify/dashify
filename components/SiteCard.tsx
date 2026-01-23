import type { components } from '@/lib/netlify/schema'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { SquircleView } from 'expo-squircle-view'
import * as StoreReview from 'expo-store-review'
import ms from 'ms'
import { useCallback, useMemo } from 'react'
import { Alert, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'

export default function SiteCard({
    site,
    onPress,
}: {
    site: components['schemas']['site']
    onPress?: () => void
}) {
    const { width: windowWidth } = useWindowDimensions()

    const countToReviewPrompt = usePersistedStore((state) => state.countToReviewPrompt)
    const setCountToReviewPrompt = usePersistedStore((state) => state.setCountToReviewPrompt)
    const lastShownReviewPrompt = usePersistedStore((state) => state.lastShownReviewPrompt)
    const setLastShownReviewPrompt = usePersistedStore((state) => state.setLastShownReviewPrompt)

    const tapSiteCard = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)

        onPress?.()

        router.push(`/sites/${site.id}/home/`)

        if (countToReviewPrompt === 0) {
            // make sure at least 1 day has passed
            if (!lastShownReviewPrompt || lastShownReviewPrompt < Date.now() - ms('1d')) {
                setLastShownReviewPrompt(Date.now())
                setCountToReviewPrompt(12)
                StoreReview.requestReview()
            }
        } else {
            setCountToReviewPrompt(countToReviewPrompt - 1)
        }
    }, [
        countToReviewPrompt,
        setCountToReviewPrompt,
        setLastShownReviewPrompt,
        lastShownReviewPrompt,
        onPress,
        site.id,
    ])

    const lastDeployTime = useMemo(() => {
        try {
            return format(new Date(site.published_deploy?.created_at ?? ''), 'dd/MM/yyyy')
        } catch {
            return ''
        }
    }, [site.published_deploy])

    const width = useMemo(() => {
        if (windowWidth < 744) {
            return '47.5%'
        }

        if (windowWidth < 1024) {
            return '31.6%'
        }

        if (windowWidth < 1280) {
            return '23.6%'
        }

        return '18.9%'
    }, [windowWidth])

    return (
        <SquircleView
            key={site.id}
            borderRadius={12}
            style={{
                width: width,
                height: 180,
                backgroundColor: COLORS.bgDark,
                elevation: 3,
                overflow: 'hidden',
            }}
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    padding: 14,
                    paddingTop: 14,
                    paddingBottom: 12,
                    // gap: 0,
                }}
                onPress={tapSiteCard}
            >
                <Text
                    numberOfLines={2}
                    style={{
                        color: COLORS.text,
                        fontSize: 16,
                        overflow: 'hidden',
                        height: 47,
                        lineHeight: 20,
                        fontWeight: '500',
                        // backgroundColor: '#ff000005',
                    }}
                    ellipsizeMode="tail"
                >
                    {site.name}
                </Text>

                <View
                    style={{
                        gap: 12,
                        flex: 1,
                        justifyContent: 'space-between',
                        // backgroundColor: '#ff00ff05',
                    }}
                >
                    {site.ssl_url !== undefined && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                                paddingRight: 8,
                            }}
                            onPress={() => {
                                try {
                                    Linking.openURL(site.ssl_url!)
                                } catch {
                                    Alert.alert('Error', 'Failed to open link, please try again.')
                                }
                            }}
                        >
                            <Ionicons name="link-outline" size={16} color={COLORS.text} />
                            <Text
                                style={{
                                    color: COLORS.text,
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                }}
                                numberOfLines={1}
                            >
                                {site.ssl_url}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingRight: 14,
                        }}
                    >
                        {site.published_deploy?.branch && (
                            <Ionicons
                                name={'git-branch-outline'}
                                size={16}
                                color={COLORS.textMuted}
                            />
                        )}
                        <Text
                            style={{
                                color: COLORS.textMuted,
                                fontSize: 12,
                                lineHeight: 14,
                            }}
                            numberOfLines={2}
                        >
                            {site.build_settings?.repo_path
                                ? `${site.build_settings?.repo_path}`
                                : 'No source control'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: COLORS.hr }} />

            <TouchableOpacity
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                    router.push(`/deployments/${site.published_deploy?.id}/`)
                    // onPress?.()
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    paddingTop: 6,
                    paddingBottom: 10,
                    gap: 2,
                }}
            >
                <View style={{ maxWidth: '80%', flexDirection: 'column', gap: 2 }}>
                    <Text style={{ color: COLORS.text, fontSize: 10 }} numberOfLines={1}>
                        {site.published_deploy?.title ||
                            site.published_deploy?.commit_message ||
                            site.published_deploy?.committer ||
                            site.published_deploy?.commit_ref?.substring(0, 8) ||
                            'Manual deploy'}
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 'semibold' }}>
                        {lastDeployTime}
                    </Text>
                </View>

                <Ionicons name="chevron-forward-outline" size={16} color={COLORS.text} />
            </TouchableOpacity>
        </SquircleView>
    )
}
