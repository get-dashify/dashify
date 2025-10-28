import netlify from '@/lib/netlify'
import { usePersistedStore } from '@/store/persisted'
import { Platform } from 'react-native'
import { fetchWebhooks } from './queries'

export async function setCustomDomain({
    siteId,
    domain,
}: { siteId: string; domain: string | null }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    try {
        const res = await fetch(
            `https://app.netlify.com/access-control/bb-api/api/v1/sites/${siteId}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    custom_domain: domain,
                }),
            }
        )

        if (res.ok) {
            return
        }

        const errorData = (await res.json()) as { message?: string }
        throw new Error(errorData.message || 'Unknown error')
    } catch (error) {
        console.error('Error removing custom domain:', error)
        throw error
    }
}

export async function setAliasDomains({ siteId, aliases }: { siteId: string; aliases: string[] }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    console.log('aliases', aliases)

    try {
        const res = await fetch(
            `https://app.netlify.com/access-control/bb-api/api/v1/sites/${siteId}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    domain_aliases: aliases,
                }),
            }
        )

        const z = await res.json()
        console.log('z', z)

        if (res.ok) {
            console.log('success')
            return
        }

        const errorData = (await res.json()) as { message?: string }
        throw new Error(errorData.message || 'Unknown error')
    } catch (error) {
        console.error('Error removing alias domain:', error)
        throw error
    }
}

export async function redeploySite({
    siteId,
    clearCache = false,
}: { siteId: string; clearCache: boolean }) {
    try {
        const response = await netlify().POST('/sites/{site_id}/builds', {
            params: {
                path: {
                    site_id: siteId,
                },
            },
            body: {
                clear_cache: clearCache,
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (error) {
        console.error('Error redeploying site:', error)
        throw error
    }
}

export async function deleteSite({ siteId }: { siteId: string }) {
    try {
        const response = await netlify().DELETE('/sites/{site_id}', {
            params: {
                path: {
                    site_id: siteId,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (error) {
        console.error('Error deleting site:', error)
        throw error
    }
}

export async function registerWebhooks({
    connectionId,
    siteId,
    pushToken,
    isSubscribed,
}: {
    connectionId: string
    siteId: string
    pushToken: string
    isSubscribed: boolean
}) {
    if (!isSubscribed) {
        throw new Error('Push Notifications require an active subscription')
    }

    let shouldRevert = false
    const webhookIds: string[] = []

    try {
        const webhooks = await fetchWebhooks({
            connectionId,
            siteId,
            pushToken,
        })

        if (webhooks.length >= 3) {
            // remove existing webhooks
            for (const webhook of webhooks) {
                if (!webhook.id) continue // pleasing the compiler
                try {
                    await deleteWebhook({
                        webhookId: webhook.id,
                        connectionId,
                    })
                } catch (error) {
                    console.log('[registerWebhook] Error unregistering webhook', error)
                    throw error
                }
            }
        }

        const randomString = new Array(12)
            .fill(0)
            .map(() => Math.random().toString(36).charAt(2))
            .join('')

        const url =
            Platform.OS === 'android'
                ? process.env.EXPO_PUBLIC_WEBHOOK_URL + '/google/notifications'
                : process.env.EXPO_PUBLIC_WEBHOOK_URL + '/apple/notifications'

        shouldRevert = true

        await createWebhook({
            connectionId,
            siteId,
            verification: randomString,
            event: 'deploy_building',
            pushToken,
        }).then((res) => {
            if (res.id) {
                webhookIds.push(res.id)
            }
        })

        await createWebhook({
            connectionId,
            siteId,
            verification: randomString,
            event: 'deploy_failed',
            pushToken,
        }).then((res) => {
            if (res.id) {
                webhookIds.push(res.id)
            }
        })

        await createWebhook({
            connectionId,
            siteId,
            verification: randomString,
            event: 'deploy_created',
            pushToken,
        }).then((res) => {
            if (res.id) {
                webhookIds.push(res.id)
            }
        })

        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                siteId: siteId,
                token: pushToken,
                verification: randomString,
            }),
        })

        if (!res.ok) {
            throw new Error('Failed to register webhook')
        }
    } catch (error) {
        if (shouldRevert) {
            for (const webhookId of webhookIds) {
                await deleteWebhook({
                    connectionId,
                    webhookId,
                }).catch((error) => {
                    console.log('[registerWebhook] Error unregistering webhook', error)
                })
            }
        }
        throw error
    }
}

export async function createWebhook({
    connectionId,
    siteId,
    verification,
    event,
    pushToken,
}: {
    connectionId: string
    siteId: string
    verification: string
    event: string
    pushToken: string
}) {
    try {
        const res = await netlify({ connectionId }).POST('/hooks', {
            params: {
                query: {
                    site_id: siteId,
                },
            },
            body: {
                site_id: siteId,
                form_id: null,
                type: 'url',
                event: event,
                data: {
                    url:
                        process.env.EXPO_PUBLIC_WEBHOOK_URL +
                        '/webhook?v=' +
                        verification +
                        '&e=' +
                        event +
                        '&_id=' +
                        pushToken.substring(0, 8),
                },
            },
        })

        if (res.error) {
            throw new Error(res.error.message)
        }

        return res.data
    } catch (error) {
        console.error('Error creating webhook:', error)
        throw error
    }
}

export async function deleteWebhook({
    connectionId,
    webhookId,
}: { connectionId: string; webhookId: string }) {
    try {
        await netlify({ connectionId }).DELETE('/hooks/{hook_id}', {
            params: {
                path: {
                    hook_id: webhookId,
                },
            },
        })
    } catch (error) {
        console.error('Error deleting webhook:', error)
        throw error
    }
}

export async function createEnvVar({
    siteId,
    accountId,
    key,
    value,
    contexts,
    scopes,
    isSecret,
}: {
    siteId: string
    accountId: string
    key: string
    value: string
    contexts: ('all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production')[]
    scopes?: ('builds' | 'functions' | 'runtime' | 'post-processing')[]
    isSecret?: boolean
}) {
    try {
        const response = await netlify().POST('/accounts/{account_id}/env', {
            params: {
                path: {
                    account_id: accountId,
                },
                query: {
                    site_id: siteId,
                },
            },
            body: [
                {
                    key,
                    values: contexts.map((context) => ({
                        value,
                        context,
                    })),
                    scopes,
                    is_secret: isSecret,
                },
            ],
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (error) {
        console.error('Error creating env var:', error)
        throw error
    }
}

export async function updateEnvVar({
    siteId,
    accountId,
    key,
    values,
    scopes,
    isSecret,
}: {
    siteId: string
    accountId: string
    key: string
    values: {
        id?: string
        value?: string
        context?: 'all' | 'dev' | 'branch-deploy' | 'deploy-preview' | 'production' | 'branch'
        context_parameter?: string
    }[]
    scopes?: ('builds' | 'functions' | 'runtime' | 'post-processing')[]
    isSecret?: boolean
}) {
    try {
        console.log('updateEnvVar payload:', { siteId, accountId, key, values, scopes, isSecret })

        // First, delete the existing variable
        await netlify().DELETE('/accounts/{account_id}/env/{key}', {
            params: {
                path: {
                    account_id: accountId,
                    key,
                },
                query: {
                    site_id: siteId,
                },
            },
        })

        // Then recreate it with new values
        const response = await netlify().POST('/accounts/{account_id}/env', {
            params: {
                path: {
                    account_id: accountId,
                },
                query: {
                    site_id: siteId,
                },
            },
            body: [
                {
                    key,
                    values: values.map((v) => ({
                        value: v.value,
                        context: v.context,
                        context_parameter: v.context_parameter,
                    })),
                    scopes,
                    is_secret: isSecret,
                },
            ],
        })

        console.log('updateEnvVar response:', response)

        if (response.error) {
            console.error('API Error:', response.error)
            throw new Error(JSON.stringify(response.error))
        }

        return response.data
    } catch (error) {
        console.error('Error updating env var:', error)
        throw error
    }
}

export async function deleteEnvVar({
    siteId,
    accountId,
    key,
}: { siteId: string; accountId: string; key: string }) {
    try {
        const response = await netlify().DELETE('/accounts/{account_id}/env/{key}', {
            params: {
                path: {
                    account_id: accountId,
                    key,
                },
                query: {
                    site_id: siteId,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (error) {
        console.error('Error deleting env var:', error)
        throw error
    }
}
