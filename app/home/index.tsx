import { fetchAccountSites, fetchLatestDeployment, fetchUserAccounts } from '@/api/queries'
import ApiStatus from '@/components/ApiStatus'
import DeploymentCard from '@/components/DeploymentCard'
import SiteCard from '@/components/SiteCard'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import RefreshControl from '@/components/base/RefreshControl'
import { useNotificationHandler } from '@/lib/hooks'
import { useWebhookCheck } from '@/lib/hooks'
import { queryClient } from '@/lib/query'
import { storage } from '@/lib/storage'
import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { HeaderButton } from '@react-navigation/elements'
import * as Sentry from '@sentry/react-native'
import { useQueries, useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import * as QuickActions from 'expo-quick-actions'
import { Stack, router } from 'expo-router'
import { SquircleView } from 'expo-squircle-view'
import * as StoreReview from 'expo-store-review'
import { usePlacement, useSuperwall, useUser } from 'expo-superwall'
import * as WebBrowser from 'expo-web-browser'
import ms from 'ms'
import { useEffect, useMemo } from 'react'
import {
    Alert,
    Image,
    Linking,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native'
import ContextMenu from 'react-native-context-menu-view'

export default function HomeScreen() {
    const { registerPlacement } = usePlacement()
    const { subscriptionStatus } = useUser()
    const { getPresentationResult } = useSuperwall()
    const { width: windowWidth } = useWindowDimensions()
    const connections = usePersistedStore((state) => state.connections)
    const removeConnection = usePersistedStore((state) => state.removeConnection)
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const switchConnection = usePersistedStore((state) => state.switchConnection)

    const currentAccountId = useMemo(
        () => currentConnection?.currentAccountId,
        [currentConnection?.currentAccountId]
    )

    const accountsQueries = useQueries({
        queries: connections.map((connection) => ({
            queryKey: ['user', connection.id, 'accounts'],
            queryFn: async () => {
                const accounts = await fetchUserAccounts({ connectionId: connection.id })
                return {
                    connectionId: connection.id,
                    accounts,
                }
            },
        })),
    })

    const currentAccount = useMemo(() => {
        const user = accountsQueries
            .filter((query) => query.data?.accounts)
            .find((query) =>
                query.data!.accounts.find((account) => account.id === currentAccountId)
            )

        if (!user) return null

        return user.data?.accounts.find((account) => account.id === currentAccountId)
    }, [accountsQueries, currentAccountId])

    const accountSitesQuery = useQuery({
        queryKey: ['sites', currentAccountId, 'all'],
        queryFn: async () => await fetchAccountSites(),
        enabled: !!currentAccountId,
    })

    const latestDeploymentQuery = useQuery({
        queryKey: ['deploys', currentAccountId, 'latest'],
        queryFn: async () => await fetchLatestDeployment(),
        enabled: !!currentAccountId,
    })

    const sites = useMemo(() => {
        return accountSitesQuery.data || []
        // return DUMMY_PROJECTS
    }, [accountSitesQuery.data])

    const cardWidth = useMemo(() => {
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

    const MissingAccount = useMemo(() => {
        return (
            <View style={{ flex: 1, gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontSize: 16, maxWidth: 320 }}>
                    This account could not be found at this time
                </Text>
                {connections.length === 1 && (
                    <TouchableOpacity
                        onPress={() => {
                            router.push('/login')
                        }}
                    >
                        <Text style={{ color: COLORS.teal500, fontSize: 16 }}>
                            Add another account
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        )
    }, [connections.length])

    useEffect(() => {
        // this is needed on first login, and when switching connections (not accounts/teams/workspaces)
        // to pick an accountId from the received ones
        console.log('currentAccountId', currentAccountId)

        if (!currentConnection) return // pleasing the compiler

        // Find the current connection's accounts
        const currentConnectionData = accountsQueries.find(
            (query) => query.data?.connectionId === currentConnection.id
        )?.data

        // still might be null even if the type says otherwise
        if (!currentConnectionData || currentConnectionData.accounts?.length === 0) return

        if (!currentAccountId) {
            for (const account of currentConnectionData.accounts) {
                // pleasing the compiler
                if (account.id && account.slug) {
                    switchConnection({
                        connectionId: currentConnection.id,
                        accountId: account.id,
                        accountSlug: account.slug,
                    })
                    break
                }
            }
        }

        // sets a new account if the user lost access to the current one
        const accountExists = accountsQueries.some((query) =>
            query.data?.accounts.some((account) => account.id === currentAccountId)
        )
        if (!accountExists && currentConnectionData) {
            for (const account of currentConnectionData.accounts) {
                // pleasing the compiler
                if (account.id && account.slug) {
                    switchConnection({
                        connectionId: currentConnection.id,
                        accountId: account.id,
                        accountSlug: account.slug,
                    })
                    break
                }
            }
        }
    }, [currentAccountId, accountsQueries, currentConnection, switchConnection])

    useEffect(() => {
        const getUrlAsync = async () => {
            // Get the deep link used to open the app
            const initialUrl = await Linking.getInitialURL()

            const eventId = initialUrl?.split('dashify:///?event=')[1]

            if (!eventId) return

            if (eventId === 'push') {
                registerPlacement({
                    placement: 'OpenNotifications',
                    feature: () => {
                        router.push('/notifications')
                        WidgetKitModule.setIsSubscribed(true)
                    },
                }).catch((error) => {
                    Sentry.captureException(error)
                    console.error('Error registering OpenNotifications', error)
                    Alert.alert('Error', 'Something went wrong, please try again.')
                })
                return
            }
        }

        getUrlAsync()
    }, [registerPlacement])

    useEffect(() => {
        if (subscriptionStatus.status !== 'INACTIVE') {
            QuickActions.isSupported().then((supported) => {
                if (!supported) return
                QuickActions.setItems(
                    Platform.OS === 'ios'
                        ? [
                              {
                                  id: '0',
                                  title: 'Bugs?',
                                  subtitle: 'Open an issue on GitHub!',
                                  icon: 'mail',
                              },
                          ]
                        : []
                )
            })
            return
        }

        try {
            getPresentationResult('LifetimeOffer_1').then((presentationResult) => {
                if (
                    ['placementnotfound', 'noaudiencematch'].includes(
                        presentationResult.type.toLowerCase()
                    )
                ) {
                    return
                }
                setTimeout(() => {
                    registerPlacement({
                        placement: 'LifetimeOffer_1',
                        feature: () => {
                            WidgetKitModule.setIsSubscribed(true)
                            Alert.alert('Congrats!', 'You unlocked lifetime access to Dashify.')
                        },
                    }).catch((error) => {
                        Sentry.captureException(error)
                        console.error('Error registering LifetimeOffer_1', error)
                    })
                }, 1000)
            })

            QuickActions.isSupported().then((supported) => {
                if (!supported) return
                QuickActions.setItems([
                    {
                        id: '0',
                        title:
                            Platform.OS === 'android'
                                ? "Don't delete me ): Tap here!"
                                : "Don't delete me ):",
                        subtitle: "Here's 50% off for life!",
                        icon: 'love',
                        params: { href: '/?showLfo1=1' },
                    },
                ])
            })
        } catch (error) {
            Sentry.captureException(error)
        }
    }, [registerPlacement, subscriptionStatus.status, getPresentationResult])

    useNotificationHandler()
    useWebhookCheck(accountsQueries)

    if (accountSitesQuery.isLoading) {
        // this is okay because it's only for loading
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <>
            <Stack.Screen
                // name="home"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: currentAccount?.name || '',
                    // title: "Emily's Team",
                    headerLeft: () => (
                        <ContextMenu
                            dropdownMenuMode={true}
                            actions={[
                                ...connections.map((connection) => ({
                                    title: connection?.email?.split('@')[0] || 'Unknown',
                                    inlineChildren: true,
                                    disabled: connection.id === currentConnection?.id,
                                    actions: [
                                        ...(accountsQueries
                                            .filter((q) => q.data)
                                            .filter((q) => q.data!.connectionId === connection.id)
                                            .map((q) => q.data!.accounts)
                                            .flatMap((accounts) =>
                                                accounts.map((account) => ({
                                                    title: account.name || 'Unnamed Account',
                                                    destructive: false,
                                                    systemIcon: isLiquidGlassAvailable()
                                                        ? connection.id === currentConnection?.id
                                                            ? 'smallcircle.filled.circle.fill'
                                                            : 'smallcircle.filled.circle'
                                                        : undefined,
                                                    disabled: account.id === currentAccountId,
                                                }))
                                            ) || []),
                                        {
                                            title: 'Remove Account',
                                            systemIcon: 'trash',
                                            destructive: true,
                                        },
                                    ],
                                })),
                                {
                                    title: 'Notifications',
                                    systemIcon: 'bell',
                                    destructive: false,
                                },
                                {
                                    title: 'Add Account',
                                    systemIcon: 'plus',
                                    destructive: false,
                                },
                            ]}
                            onPress={(e) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)

                                if (e.nativeEvent.name === 'Remove Account') {
                                    const [connectionPath] = e.nativeEvent.indexPath // [connectionPath, actionPath]

                                    Alert.alert(
                                        'Remove Account',
                                        'Are you sure you want to remove this connection?',
                                        [
                                            {
                                                text: 'Remove',
                                                onPress: () => {
                                                    // we can  use the same index because they get displayed in the same order
                                                    const connectionId =
                                                        accountsQueries[connectionPath].data
                                                            ?.connectionId
                                                    if (!connectionId) return

                                                    removeConnection(connectionId)

                                                    // if we had 1 connection before, we will have none
                                                    if (connections.length === 1) {
                                                        storage.clearAll()
                                                        router.dismissAll()
                                                        router.replace('/login')
                                                        queryClient.clear()
                                                        return
                                                    }
                                                },
                                                style: 'destructive',
                                            },
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                            },
                                        ]
                                    )

                                    return
                                }

                                if (e.nativeEvent.name === 'Add Account') {
                                    const featureFn = () => {
                                        router.push('/login')
                                        WidgetKitModule.setIsSubscribed(true)
                                    }

                                    if (__DEV__) {
                                        featureFn()
                                        return
                                    }

                                    registerPlacement({
                                        placement: 'AddConnection',
                                        feature: featureFn,
                                    }).catch((error) => {
                                        Sentry.captureException(error)
                                        console.error('Error registering AddConnection', error)
                                        Alert.alert(
                                            'Error',
                                            'Something went wrong, please try again.'
                                        )
                                    })

                                    return
                                }

                                if (e.nativeEvent.name === 'Notifications') {
                                    const featureFn = () => {
                                        router.push('/notifications')
                                        WidgetKitModule.setIsSubscribed(true)
                                    }

                                    if (__DEV__) {
                                        featureFn()
                                        return
                                    }

                                    registerPlacement({
                                        placement: 'OpenNotifications',
                                        feature: () => {
                                            featureFn()
                                        },
                                    }).catch((error) => {
                                        Sentry.captureException(error)
                                        console.error('Error registering OpenNotifications', error)
                                        Alert.alert(
                                            'Error',
                                            'Something went wrong, please try again.'
                                        )
                                    })
                                    return
                                }

                                const [connectionPath, accountPath] = e.nativeEvent.indexPath
                                const selectedConnection =
                                    accountsQueries[connectionPath].data?.connectionId
                                const selectedAccount = accountsQueries
                                    .find((t) => t.data?.connectionId === selectedConnection)
                                    ?.data?.accounts.at(accountPath)

                                if (!selectedAccount || !selectedConnection) return
                                if (!selectedAccount.id || !selectedAccount.slug) return // pleasing the compiler

                                if (selectedAccount.id !== currentAccountId) {
                                    switchConnection({
                                        connectionId: selectedConnection,
                                        accountId: selectedAccount.id,
                                        accountSlug: selectedAccount.slug,
                                    })
                                    return
                                }
                            }}
                        >
                            <HeaderButton
                                style={{
                                    marginRight: isLiquidGlassAvailable() ? undefined : 10,
                                }}
                            >
                                <Image
                                    source={
                                        currentAccount?.team_logo_url
                                            ? {
                                                  uri: currentAccount?.team_logo_url,
                                              }
                                            : require('@/assets/icon.png')
                                    }
                                    borderRadius={isLiquidGlassAvailable() ? 16 : 10}
                                    style={
                                        isLiquidGlassAvailable()
                                            ? { width: 32, height: 32 }
                                            : { width: 20, height: 20 }
                                    }
                                />
                            </HeaderButton>
                        </ContextMenu>
                    ),
                    headerRight: () => (
                        <ContextMenu
                            dropdownMenuMode={true}
                            actions={[
                                {
                                    title: 'Icons',
                                    systemIcon: 'app.gift',
                                },
                                {
                                    title: 'Feedback',
                                    systemIcon: 'message',
                                },
                                {
                                    title: 'Rate',
                                    systemIcon: 'star.fill',
                                },
                            ]}
                            onPress={async (e) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)

                                if (e.nativeEvent.name === 'Icons') {
                                    if (__DEV__) {
                                        router.push('/icons/')
                                        return
                                    }

                                    registerPlacement({
                                        placement: 'AppIcons',
                                        feature: () => {
                                            router.push('/icons/')
                                        },
                                    })
                                    return
                                }
                                if (e.nativeEvent.name === 'Feedback') {
                                    await WebBrowser.openBrowserAsync(
                                        process.env.EXPO_PUBLIC_FEEDBACK_URL!
                                    )
                                    return
                                }
                                if (e.nativeEvent.name === 'Rate') {
                                    Alert.alert(
                                        'Do you like Dashify?',
                                        'Let us know about your experience.',
                                        [
                                            {
                                                text: 'No',
                                                onPress: () => {
                                                    Alert.alert(
                                                        'Thank you!',
                                                        'Your review has been sent successfully.'
                                                    )
                                                },
                                            },
                                            {
                                                text: 'Yes',
                                                onPress: () => {
                                                    if (
                                                        usePersistedStore.getState().installTs <
                                                        Date.now() - ms('1d')
                                                    ) {
                                                        StoreReview.requestReview()
                                                        return
                                                    }

                                                    registerPlacement({
                                                        placement: 'LifetimeOffer_1_Show',
                                                        feature: async () => {
                                                            await StoreReview.requestReview()
                                                        },
                                                    }).catch((error) => {
                                                        Sentry.captureException(error)
                                                        console.error(
                                                            'Error registering LifetimeOffer_1_Show for Rate',
                                                            error
                                                        )
                                                    })
                                                },
                                            },
                                        ]
                                    )
                                    return
                                }
                            }}
                        >
                            <HeaderTouchableOpacity>
                                <Ionicons
                                    name="ellipsis-horizontal-sharp"
                                    size={32}
                                    color={COLORS.text}
                                />
                            </HeaderTouchableOpacity>
                        </ContextMenu>
                    ),
                }}
            />
            {currentAccount ? (
                <ScrollView
                    style={{ flex: 1 }}
                    contentInsetAdjustmentBehavior="automatic"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            onRefresh={async () => {
                                await Promise.all([
                                    queryClient.invalidateQueries({ queryKey: ['apiStatus'] }),
                                    accountSitesQuery.refetch(),
                                    latestDeploymentQuery.refetch(),
                                ])
                            }}
                        />
                    }
                    contentContainerStyle={{ gap: 20, paddingHorizontal: 16 }}
                >
                    {latestDeploymentQuery.data && (
                        <DeploymentCard
                            deployment={latestDeploymentQuery.data}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                router.push(`/deployments/${latestDeploymentQuery.data.id}`)
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: COLORS.teal500,
                                    // backgroundColor: '#ff00ff05',
                                    textAlign: 'center',
                                    paddingTop: 16,
                                }}
                            >
                                Tap to view deployment details →
                            </Text>
                        </DeploymentCard>
                    )}

                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 18,
                        }}
                    >
                        {sites.map((site) => (
                            <SiteCard key={site.id} site={site} />
                        ))}

                        <SquircleView
                            borderRadius={12}
                            style={{
                                width: cardWidth,
                                height: 180,
                                backgroundColor: COLORS.bgDark,
                                elevation: 3,
                                overflow: 'hidden',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
                                    router.push('/sites/all')
                                }}
                            >
                                <Ionicons
                                    name="arrow-forward-circle-outline"
                                    size={32}
                                    color={COLORS.text}
                                />
                                <Text style={{ color: COLORS.text }}>View All Sites</Text>
                            </TouchableOpacity>
                        </SquircleView>
                    </View>

                    <View style={{ paddingTop: 16 }}>
                        <ApiStatus />
                    </View>
                </ScrollView>
            ) : (
                MissingAccount
            )}
        </>
    )
}
