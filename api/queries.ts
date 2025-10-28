import netlify from '@/lib/netlify'
import type { components } from '@/lib/netlify/schema'
import { usePersistedStore } from '@/store/persisted'
import ms from 'ms'

export async function fetchUserInfo() {
    console.log('fetchUserInfo')

    try {
        const response = await netlify().GET('/user')

        console.log('User info', response)

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching user info', error)
        throw error
    }
}

export async function fetchUserAccounts({ connectionId }: { connectionId?: string } = {}) {
    try {
        const response = await netlify({ connectionId }).GET('/accounts')

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching user teams', error)
        throw error
    }
}

export async function fetchLatestDeployment() {
    try {
        const sites = (await fetchAccountSites()) as components['schemas']['site'][]
        const deploymentsForSites = await Promise.all(
            sites
                .filter((site) => site.id)
                .map((site) => fetchSiteDeployments({ id: site.id!, page: 1, perPage: 1 }))
        )
        const deployments = deploymentsForSites.flat()
        const latestDeployment = deployments.sort((a, b) => {
            if (!a?.created_at || !b?.created_at) {
                return 0
            }
            if (!a.created_at) {
                return 1
            }
            if (!b.created_at) {
                return -1
            }
            return Date.parse(b.created_at) - Date.parse(a.created_at)
        })[0]
        return latestDeployment
    } catch (error) {
        console.log('Error fetching latest deployment', error)
        throw error
    }
}

export async function fetchAccountSites({
    connectionId,
    accountSlug,
}: {
    connectionId?: string
    accountSlug?: string
} = {}) {
    const currentConnection = usePersistedStore.getState().currentConnection

    const currentAccountSlug = accountSlug || currentConnection?.currentAccountSlug

    if (!currentAccountSlug) {
        throw new Error('No account slug found')
    }

    try {
        const response = await netlify({ connectionId }).GET('/{account_slug}/sites', {
            params: {
                path: {
                    account_slug: currentAccountSlug,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching sites', error)
        throw error
    }
}

export async function fetchSite({ id }: { id: string }) {
    try {
        const response = await netlify().GET('/sites/{site_id}', {
            params: {
                path: {
                    site_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchSiteBuilds({ id }: { id: string }) {
    try {
        const response = await netlify().GET('/sites/{site_id}/builds', {
            params: {
                path: {
                    site_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

// export async function fetchSiteDomains({ id }: { id: string }) {
//     try {
//         const response = await netlify().GET('/sites/{site_id}/dns', {
//             params: {
//                 path: {
//                     site_id: id,
//                 },
//             },
//         })

//         if (response.error) {
//             throw new Error(response.error.message)
//         }

//         return response.data
//     } catch (e) {
//         const error = e as Error
//         console.log('Error fetching project info', error)
//         throw error
//     }
// }

export async function fetchSiteDomains({ id }: { id: string }) {
    try {
        const response = await fetchSite({ id })

        const customDomain = response.custom_domain
        const defaultDomain = (response as any)?.default_domain as string | undefined
        const aliases = response.domain_aliases || []

        // site.default_domain (string)
        // site.custom_domain (string) (add www or non-www to the domain)
        // site.domain_aliases (array of strings)

        return {
            customDomain,
            defaultDomain,
            aliases,
        }
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchSiteForms({ id }: { id: string }) {
    try {
        const response = await netlify().GET('/sites/{site_id}/forms', {
            params: {
                path: {
                    site_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchFormSubmissions({ id }: { id: string }) {
    try {
        const response = await netlify().GET('/forms/{form_id}/submissions', {
            params: {
                path: {
                    form_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching form submissions', error)
        throw error
    }
}

export async function fetchSiteDeployment({ id }: { id: string }) {
    try {
        const response = await netlify().GET('/deploys/{deploy_id}', {
            params: {
                path: {
                    deploy_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching site deployment', error)
        throw error
    }
}

export async function fetchSiteDeployments({
    id,
    page = 1,
    perPage = 100,
}: { id: string; page?: number; perPage?: number }) {
    try {
        const response = await netlify().GET('/sites/{site_id}/deploys', {
            params: {
                path: {
                    site_id: id,
                },
                query: {
                    page,
                    per_page: perPage,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchSiteDeploymentSummary({ id }: { id: string }) {
    try {
        // @ts-ignore
        const response = (await netlify().GET('/deploys/{deploy_id}/summary', {
            params: {
                path: {
                    deploy_id: id,
                },
            },
        })) as { error?: { message: string }; data?: any; response?: any }

        if (response.error) {
            throw new Error(response.error.message)
        }

        const data: Required<components['schemas']['deploy']>['summary'] = response.data

        return data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchSiteDeploymentFiles({ id }: { id: string }) {
    try {
        // @ts-ignore
        const response = (await netlify().GET('/deploys/{deploy_id}/files', {
            params: {
                path: {
                    deploy_id: id,
                },
            },
        })) as { error?: { message: string }; data?: any; response?: any }

        if (response.error) {
            throw new Error(response.error.message)
        }

        const data: {
            id: string
            path: string
            sha: string
            mime_type: string
            size: number
            site_id: string
            deploy_id: string
        }[] = response.data

        return data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchSiteDeploymentLogs({ id }: { id: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    try {
        const res = await fetch(
            'https://app.netlify.com/access-control/generate-access-control-token',
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        )

        const data = await res.json()

        const payload = {
            deploy_id: id,
            access_token: data.accessControlToken,
        }

        const ws = new WebSocket('wss://socketeer.services.netlify.com/build/logs')

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
            ws.onopen = () => {
                console.log('WebSocket opened')
                // Send connection initialization message first
                ws.send(JSON.stringify(payload))
                resolve(true)
            }
            ws.onerror = (error) => reject(error)
        })

        // Set up ping/pong to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
            }
        }, 30000)

        // Clean up ping interval if connection closes
        ws.onclose = () => {
            clearInterval(pingInterval)
        }

        return ws
    } catch (error) {
        console.error('Error establishing WebSocket connection:', error)
        throw error
    }
}

export async function fetchSiteFunctions({ id }: { id: string }) {
    console.log('fetchSiteFunctions', id)
    try {
        const response = await netlify().GET('/sites/{site_id}/functions', {
            params: {
                path: {
                    site_id: id,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        //! the OpenAPI type is wrong, we do not get the functions array directly
        return (response.data as (typeof response.data)[0]).functions
    } catch (e) {
        const error = e as Error
        console.log('Error fetching site functions', error)
        throw error
    }
}

/* LOGS */

// https://app.netlify.com/access-control/analytics-api/v2/sites/43c7075c-180f-4143-83cf-75b82b6c967b/edge_function_logs?from=1740061426916&to=1740147826916

// https://app.netlify.com/access-control/analytics-api/v2/sites/43c7075c-180f-4143-83cf-75b82b6c967b/branch/main/function_logs/__api?from=1740061486522&to=1740147886522

export async function fetchEdgeFunctionLogs({ siteId }: { siteId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    const now = Date.now()
    const oneDayAgo = now - ms('1d') + ms('1m') // 1m for buffer

    try {
        const res = await fetch(
            `https://app.netlify.com/access-control/analytics-api/v2/sites/${siteId}/edge_function_logs?from=${oneDayAgo}&to=${now}`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        )

        const data = (await res.json()) as {
            logs: {
                type: 'line' | string
                ts: number
                level: 'error' | 'info' | 'debug'
                netlify_request_id: string
                message: string
            }[]
        }

        return data
    } catch (error) {
        console.error('Error fetching edge function logs:', error)
        throw error
    }
}

export async function fetchFunctionLogs({ siteId }: { siteId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    const now = Date.now()
    const oneDayAgo = now - ms('1d') + ms('1m') // 1m for buffer

    async function fetcher(functionName?: string) {
        const res = await fetch(
            `https://app.netlify.com/access-control/analytics-api/v2/sites/${siteId}/branch/main/function_logs/${functionName}?from=${oneDayAgo}&to=${now}`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        )

        const data = (await res.json()) as {
            logs: {
                type: 'line' | string
                ts: number
                level: 'ERROR' | 'INFO' | 'DEBUG'
                netlify_request_id: string
                message: string
            }[]
        }

        return data.logs
    }

    try {
        const functions = await fetchSiteFunctions({ id: siteId })

        if (!functions) {
            return {
                logs: [],
            }
        }

        const names = functions.map((fn) => fn.n)

        const promises = names.map((name) => fetcher(name))

        const data = await Promise.all(promises)

        return {
            logs: data.flat(),
        }
    } catch (error) {
        console.error('Error fetching function logs:', error)
        throw error
    }
}

export async function wsEdgeFunctionLogs({
    deployId,
    siteId,
}: { deployId: string; siteId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    try {
        const res = await fetch(
            'https://app.netlify.com/access-control/generate-access-control-token',
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        )

        const data = await res.json()

        const payload = {
            deploy_id: deployId,
            access_token: data.accessControlToken,
            site_id: siteId,
        }

        const ws = new WebSocket('wss://socketeer.services.netlify.com/edge-function/logs')

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
            ws.onopen = () => {
                console.log('WebSocket opened')
                // Send connection initialization message first
                ws.send(JSON.stringify(payload))
                resolve(true)
            }
            ws.onerror = (error) => reject(error)
        })

        // Set up ping/pong to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
            }
        }, 30000)

        // Clean up ping interval if connection closes
        ws.onclose = () => {
            clearInterval(pingInterval)
        }

        return ws
    } catch (error) {
        console.error('Error establishing WebSocket connection:', error)
        throw error
    }
}

export async function wsFunctionLogs({
    functionId,
    siteId,
}: { functionId: string; siteId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection
    const apiToken = currentConnection?.apiToken

    if (!apiToken) {
        throw new Error('No API token found')
    }

    // req to https://app.netlify.com/access-control/bb-api/api/v1/sites/43c7075c-180f-4143-83cf-75b82b6c967b/functions
    // get data.functions
    // accountId = function.a
    // functionId = function.oid

    const accountId = '099096387579'

    try {
        const res = await fetch(
            'https://app.netlify.com/access-control/generate-access-control-token',
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        )

        const data = await res.json()

        const payload = {
            account_id: accountId,
            access_token: data.accessControlToken,
            function_id: functionId,
            site_id: siteId,
        }

        const ws = new WebSocket('wss://socketeer.services.netlify.com/function/logs')

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
            ws.onopen = () => {
                console.log('WebSocket opened')
                // Send connection initialization message first
                ws.send(JSON.stringify(payload))
                resolve(true)
            }
            ws.onerror = (error) => reject(error)
        })

        // Set up ping/pong to keep connection alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
            }
        }, 30000)

        // Clean up ping interval if connection closes
        ws.onclose = () => {
            clearInterval(pingInterval)
        }

        return ws
    } catch (error) {
        console.error('Error establishing WebSocket connection:', error)
        throw error
    }
}

export async function fetchApiStatus() {
    const response = await fetch('https://www.netlifystatus.com/api/v2/status.json')
    const data = (await response.json()) as {
        page: {
            id: string
            name: string
            url: string
            time_zone: string
            updated_at: Date
        }
        status: {
            indicator: string
            description: string
        }
    }
    return data?.status
}

export async function fetchWebhooks({
    connectionId,
    siteId,
    pushToken,
}: { connectionId: string; siteId: string; pushToken: string }) {
    try {
        const response = await netlify({ connectionId }).GET('/hooks', {
            params: {
                query: {
                    site_id: siteId,
                },
            },
        })

        if (response.error) {
            throw new Error(response.error.message)
        }

        return (response.data || []).filter(
            (hook) =>
                hook.data?.url?.includes(process.env.EXPO_PUBLIC_WEBHOOK_URL!) &&
                hook.data?.url?.includes(`_id=${pushToken.substring(0, 8)}`)
        )
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchWebhookEvents() {
    try {
        const response = await netlify().GET('/hooks/types')

        if (response.error) {
            throw new Error(response.error.message)
        }

        console.log(JSON.stringify(response.data, null, 2))

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error fetching project info', error)
        throw error
    }
}

export async function fetchBlockedWebRequests({ siteId }: { siteId: string }) {
    const currentConnection = usePersistedStore.getState().currentConnection

    if (!currentConnection) {
        throw new Error('No connection found')
    }

    const now = Date.now()
    const oneWeekAgo = now - ms('7d') + ms('1m') // 1m for buffer

    const response = await fetch(
        `https://app.netlify.com/access-control/analytics-api/v2/${siteId}/blocked_web_requests?from=${oneWeekAgo}&to=${now}&resolution=hour`,
        {
            headers: {
                cookie: `_nf-auth=${currentConnection.apiToken};`,
            },
        }
    )

    if (!response.ok) {
        throw new Error('Failed to fetch blocked web requests')
    }

    const data = (await response.json()) as {
        time: string
        values: Record<
            | 'allowed'
            | 'blocked_waf'
            | 'blocked_firewall_traffic_rules'
            | 'blocked_ratelimiting_traffic_rules',
            number
        >
    }[]

    return data
}

export async function fetchSiteEnvVars({
    siteId,
    accountId,
}: { siteId: string; accountId: string }) {
    try {
        const response = await netlify().GET('/accounts/{account_id}/env', {
            params: {
                path: {
                    account_id: accountId,
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
    } catch (e) {
        const error = e as Error
        console.log('Error fetching site env vars', error)
        throw error
    }
}

export async function fetchSiteEnvVar({
    siteId,
    accountId,
    key,
}: { siteId: string; accountId: string; key: string }) {
    try {
        const response = await netlify().GET('/accounts/{account_id}/env/{key}', {
            params: {
                path: {
                    account_id: accountId,
                    key: key,
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
    } catch (e) {
        const error = e as Error
        console.log('Error fetching site env var', error)
        throw error
    }
}

// // show only sites with source control
// export async function fetchFunctionMetrics({ siteId }: { siteId: string }) {
//     const currentConnection = usePersistedStore.getState().currentConnection

//     if (!currentConnection) {
//         throw new Error('No connection found')
//     }

//     const now = Date.now()
//     const oneDayAgo = now - ms('7d') + ms('1m') // 1m for buffer
//     const branch = 'main'

//     const response = await fetch(
//         `https://app.netlify.com/access-control/analytics-api/v2/sites/${siteId}/site_usage_metrics/functions?from=${oneDayAgo}&to=${now}&branch=${branch}&resolution=range&filter=sum_duration,count,errors`,
//         {
//             headers: {
//                 cookie: `_nf-auth=${currentConnection.apiToken};`,
//             },
//         }
//     )

//     if (!response.ok) {
//         throw new Error('Failed to fetch function metrics')
//     }

//     const data = (await response.json()) as {
//         data: {
//             errors: number
//             successes: number
//             count: number
//             avg_duration: number
//             max_duration: number
//             sum_duration: number
//             p50: number
//             p95: number
//             p99: number
//         }[]
//     }

//     return data.data[0]
// }
