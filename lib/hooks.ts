import { deleteWebhook } from '@/api/mutations'
import { fetchAccountSites, fetchWebhooks } from '@/api/queries'
import { queryClient } from '@/lib/query'
import { type UseQueryResult, useQueries } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'

// gets all possible webhooks (all accounts, all sites) and unregisters them if push notifications are disabled
export function useWebhookCheck(
    accountsQueries: UseQueryResult<{ accounts: any[]; connectionId: string }>[]
) {
    const [pushToken, setPushToken] = useState<string | null>(null)

    const isChecking = useRef(false)

    const allAccountSlugs = useMemo(() => {
        console.log('[useWebhookCheck] allAccountSlugs changing')
        const accounts: { accountId: string; accountSlug: string; connectionId: string }[] = []

        for (const accountQuery of accountsQueries) {
            if (accountQuery.data?.accounts) {
                for (const account of accountQuery.data.accounts) {
                    if (account.id) {
                        accounts.push({
                            accountId: account.id,
                            accountSlug: account.slug,
                            connectionId: accountQuery.data.connectionId,
                        })
                    }
                }
            }
        }

        return accounts
    }, [accountsQueries])

    const sitesQueries = useQueries({
        queries: allAccountSlugs.map(({ accountId, accountSlug, connectionId }) => ({
            queryKey: ['sites', accountId, 'all'],
            queryFn: async () => await fetchAccountSites({ connectionId, accountSlug }),
            enabled: !!accountSlug,
        })),
    })

    const allSiteIds = useMemo(() => {
        console.log('[useWebhookCheck] allSiteIds changing')

        if (isChecking.current) {
            console.log('[useWebhookCheck] allSiteIds already checking')
            return []
        }

        return allAccountSlugs.flatMap(({ accountSlug, connectionId }) => {
            return sitesQueries
                .flatMap((query) =>
                    query.data
                        ?.filter((site) => site.account_slug === accountSlug)
                        .map((site) => ({
                            siteId: site.id!,
                            connectionId: connectionId,
                        }))
                )
                .filter((site) => site !== undefined)
        })
    }, [sitesQueries, allAccountSlugs])

    const webhooksQueries = useQueries({
        queries: allSiteIds.map(({ siteId, connectionId }) => ({
            queryKey: ['webhooks', siteId],
            queryFn: async () => {
                if (!pushToken) return null

                const webhooks = await fetchWebhooks({ connectionId, siteId, pushToken })

                return {
                    webhooks: webhooks,
                    connectionId: connectionId,
                    siteId: siteId,
                }
            },
        })),
    })

    const webhooks = useMemo(() => {
        return webhooksQueries
            .map((q) => q.data)
            .filter(Boolean)
            .flatMap((q) =>
                q.webhooks.map((hook) => ({
                    ...hook,
                    _connectionId: q.connectionId,
                }))
            )
    }, [webhooksQueries])

    useEffect(() => {
        if (webhooks.length === 0) return

        if (isChecking.current) {
            console.log('[useWebhookCheck] already checking')
            return
        }

        isChecking.current = true

        async function disableWebhooks() {
            if (webhooks.length === 0) {
                console.log('[useWebhookCheck] no valid queries')
                return
            }

            for (const hook of webhooks) {
                if (!hook.id) continue // pleasing the compiler

                await deleteWebhook({
                    webhookId: hook.id,
                    connectionId: hook._connectionId,
                })
            }

            await queryClient.resetQueries({ queryKey: ['webhooks'] })
        }

        // check push notification status
        Notifications.getPermissionsAsync()
            .then(async ({ granted }) => {
                console.log('[disableWebhooks] granted', granted)
                if (!granted) {
                    console.log('[disableWebhooks] status not granted')
                    // disable webhooks for all teams
                    await disableWebhooks()
                    return
                }

                await Notifications.getDevicePushTokenAsync().then((token) => {
                    setPushToken(token.data)
                })
            })
            .catch((error) => {
                console.log('[disableWebhooks] error', error)
            })
            .finally(() => {
                isChecking.current = false
            })
    }, [webhooks])
}

export function useNotificationHandler() {
    const notificationTapListener = useRef<Notifications.EventSubscription | null>(null)

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: Platform.OS === 'android',
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        })

        notificationTapListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                router.replace('/home')
            }
        )
        return () => {
            if (notificationTapListener.current) {
                notificationTapListener.current.remove()
            }
        }
    }, [])
}

export function useFlashlistProps(placeholder?: React.ReactNode) {
    const isAndroid = useMemo(() => Platform.OS === 'android', [])

    if (isAndroid) {
        return {
            overrideProps: undefined,
        }
    }

    return {
        overrideProps: placeholder
            ? {
                  contentContainerStyle: {
                      flex: 1,
                  },
              }
            : undefined,
    }
}
