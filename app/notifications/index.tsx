import { deleteWebhook, registerWebhooks } from '@/api/mutations'
import { fetchAccountSites, fetchUserAccounts, fetchWebhooks } from '@/api/queries'
import RefreshControl from '@/components/base/RefreshControl'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueries } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { useUser } from 'expo-superwall'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Image, Platform, ScrollView, Switch, Text, View } from 'react-native'
import { useDebouncedCallback } from 'use-debounce'

export default function NotificationsScreen() {
    const connections = usePersistedStore((state) => state.connections)

    const [hasPushEnabled, setHasPushEnabled] = useState(false)
    const [pushToken, setPushToken] = useState<string | null>(null)

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

    const dataForAccountId = useMemo(() => {
        const accountMap: Record<
            string,
            Awaited<ReturnType<typeof fetchUserAccounts>>[number] & { connectionId: string }
        > = {}

        for (const accountQuery of accountsQueries) {
            if (accountQuery.data?.accounts) {
                for (const account of accountQuery.data.accounts) {
                    // pleasing the compiler
                    if (account.id) {
                        accountMap[account.id] = {
                            ...account,
                            connectionId: accountQuery.data.connectionId,
                        }
                    }
                }
            }
        }

        return accountMap
    }, [accountsQueries])

    const allAccountIds = useMemo(() => {
        return Object.keys(dataForAccountId)
    }, [dataForAccountId])

    useEffect(() => {
        Notifications.getPermissionsAsync().then(async ({ granted }) => {
            if (!granted) return

            await Notifications.getDevicePushTokenAsync().then((token) => {
                setPushToken(token.data)
                setHasPushEnabled(true)
                // making sure it gets refreshed
                setTimeout(() => {
                    queryClient.resetQueries({ queryKey: ['webhooks'] })
                }, 1000)
            })
        })
    }, [])

    const enablePush = useCallback(async () => {
        const { status: currentStatus, canAskAgain } =
            await Notifications.getPermissionsAsync().catch(() => {
                return { status: undefined, canAskAgain: false }
            })

        if (!currentStatus) return

        if (currentStatus === Notifications.PermissionStatus.GRANTED) {
            await Notifications.getDevicePushTokenAsync().then(
                (token) => {
                    setPushToken(token.data)
                    setHasPushEnabled(true)
                },
                () => {
                    Alert.alert('Push notifications could not be enabled', 'Please try again later')
                }
            )
            return
        }

        if (!canAskAgain) {
            Alert.alert(
                'Push notifications are not enabled',
                'Please enable push notifications in your device settings'
            )
            return
        }

        const { status } = await Notifications.requestPermissionsAsync().catch(() => {
            return { status: undefined }
        })

        if (!status) return

        if (status === Notifications.PermissionStatus.GRANTED) {
            await Notifications.getDevicePushTokenAsync().then(
                (token) => {
                    setPushToken(token.data)
                    setHasPushEnabled(true)
                },
                () => {
                    Alert.alert('Push notifications could not be enabled', 'Please try again later')
                }
            )
        }
    }, [])

    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ flex: 1 }}
            refreshControl={
                <RefreshControl
                    onRefresh={async () => {
                        await queryClient.resetQueries({ queryKey: ['webhooks'] })
                        // queryClient.refetchQueries({ queryKey: ['webhooks'] })
                        // queryClient.removeQueries({ queryKey: ['webhooks'] })
                    }}
                />
            }
        >
            {/* <Button title="Register Webhook" onPress={() => addWebhooksMutation.mutate()} />

            <Button
                title="Refresh Webhooks"
                onPress={() => {
                    for (const query of webhooksQueries) {
                        query.refetch()
                    }
                }}
            /> */}

            <View style={{ marginTop: 20 }}>
                {allAccountIds.map((accountId, accountIndex) => (
                    <AccountCard
                        key={accountId}
                        account={dataForAccountId[accountId]}
                        hasPushEnabled={hasPushEnabled}
                        enablePush={enablePush}
                        pushToken={pushToken}
                        backgroundColor={accountIndex % 2 === 0 ? 'transparent' : COLORS.bgDark}
                    />
                ))}
            </View>
        </ScrollView>
    )
}

function AccountCard({
    account,
    hasPushEnabled,
    enablePush,
    pushToken,
    backgroundColor,
}: {
    account: Awaited<ReturnType<typeof fetchUserAccounts>>[number] & { connectionId: string }
    hasPushEnabled: boolean
    enablePush: () => Promise<void>
    pushToken: string | null
    backgroundColor: string
}) {
    const accountSitesQuery = useQuery({
        queryKey: ['sites', account.id, 'all'],
        queryFn: async () =>
            await fetchAccountSites({
                connectionId: account.connectionId,
                accountSlug: account.slug,
            }),
        enabled: !!account.id,
    })

    return (
        <View style={{ flexDirection: 'column', gap: 20, backgroundColor, padding: 14 }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            overflow: 'hidden',
                        }}
                    >
                        <Image
                            source={{
                                uri: account.team_logo_url || require('@/assets/icon.png'),
                            }}
                            style={{ flex: 1 }}
                        />
                    </View>
                    <Text style={{ fontSize: 24, color: COLORS.text }}>{account.name}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'column', gap: 10 }}>
                {accountSitesQuery.data?.map((site) => (
                    <SiteRow
                        key={site.id}
                        site={{
                            ...site,
                            connectionId: account.connectionId,
                            accountId: account.id!,
                        }}
                        hasPushEnabled={hasPushEnabled}
                        enablePush={enablePush}
                        pushToken={pushToken}
                    />
                ))}
            </View>
        </View>
    )
}

function SiteRow({
    site,
    hasPushEnabled,
    enablePush,
    pushToken,
}: {
    site: Awaited<ReturnType<typeof fetchAccountSites>>[number] & {
        connectionId: string
        accountId: string
    }
    hasPushEnabled: boolean
    enablePush: () => Promise<void>
    pushToken: string | null
}) {
    const { subscriptionStatus } = useUser()
    const [enabled, setEnabled] = useState(false)

    const webhooksQuery = useQuery({
        queryKey: ['webhooks', site.accountId, site.id],
        queryFn: async () => {
            // pleasing the compiler
            if (!site.id) return
            if (!pushToken) return

            const webhooks = await fetchWebhooks({
                connectionId: site.connectionId,
                siteId: site.id,
                pushToken: pushToken,
            })

            console.log(
                '[webhookQuery] webhook for site',
                site.id,
                JSON.stringify(webhooks, null, 2)
            )

            return {
                webhooks: webhooks,
                connectionId: site.connectionId,
                accountId: site.accountId,
                siteId: site.id,
            }
        },
    })

    const registerWebhooksMutation = useMutation({
        mutationFn: async () => {
            if (!pushToken) return

            await registerWebhooks({
                connectionId: site.connectionId,
                siteId: site.id!,
                pushToken: pushToken,
                isSubscribed: subscriptionStatus.status === 'ACTIVE',
            })
        },
        onSuccess: async () => {
            await webhooksQuery.refetch()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const unregisterWebhooksMutation = useMutation({
        mutationFn: async () => {
            if (!webhooksQuery.data) return

            for (const webhook of webhooksQuery.data.webhooks) {
                if (!webhook.id) continue // pleasing the compiler

                console.log('[unregisterWebhooksMutation] unregistering webhook', webhook.id)

                await deleteWebhook({
                    webhookId: webhook.id,
                    connectionId: site.connectionId,
                })
            }
        },
        onSuccess: async () => {
            await webhooksQuery.refetch()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    useEffect(() => {
        // biome-ignore lint/style/useExplicitLengthCheck: <explanation>
        if (!webhooksQuery.data?.webhooks?.length) return
        setEnabled(true)
    }, [webhooksQuery.data])

    const toggleWebhooksDebounced = useDebouncedCallback(async (enabled: boolean) => {
        if (enabled) {
            await unregisterWebhooksMutation.mutateAsync()
        } else {
            await registerWebhooksMutation.mutateAsync()
        }
    }, 1000)

    const toggleEvent = useCallback(async () => {
        if (!hasPushEnabled || !pushToken) {
            await enablePush()
            return
        }

        setEnabled(!enabled)
        toggleWebhooksDebounced(enabled)
    }, [toggleWebhooksDebounced, hasPushEnabled, enablePush, pushToken, enabled])

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
            }}
        >
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.text }}>
                {site.name}
            </Text>

            <Switch
                value={enabled}
                onValueChange={toggleEvent}
                trackColor={{
                    true: COLORS.teal,
                    false: undefined,
                }}
                thumbColor={Platform.OS === 'android' ? COLORS.teal300 : undefined}
            />
        </View>
    )
}
