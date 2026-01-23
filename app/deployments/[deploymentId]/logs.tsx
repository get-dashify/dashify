import { fetchSiteDeploymentLogs } from '@/api/queries'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { FlashList } from '@shopify/flash-list'
import { format } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useGlobalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'

const SECTIONS = {
    initializing: 'Initializing',
    building: 'Building',
    deploying: 'Deploying',
    postprocessing: 'Post-processing',
    cleanup: 'Cleanup',
}

const LOG_COLORS = {
    error: COLORS.red600,
    warn: COLORS.gold600,
    info: COLORS.blue600,
    debug: COLORS.text,
    default: COLORS.text,
} as const

type LogMessage = {
    type: string
    ts: number
    level: string
    message: string
    section: keyof typeof SECTIONS
}

function sanitizeLogMessage(message: string): string {
    return (
        message
            // Remove control characters and non-printable characters
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            // Remove ANSI escape codes including cursor controls like [2K[1G
            .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
            .replace(/\[[0-9]+[A-Z]/g, '') // Handles [2K, [1G etc.
            .replace(/\[[0-9;]+m/g, '') // Remove color codes
            // Remove common build tool noise
            .replace(/^\s*\*+\s*/gm, '')
            .replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '')
            // Remove carriage returns that might be used for terminal updates
            .replace(/\r+/g, '')
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim()
    )
}

export default function ProjectLogs() {
    const { deploymentId } = useGlobalSearchParams<{
        deploymentId: string
    }>()

    const [isExpanded, setIsExpanded] = useState(false)
    const [logs, setLogs] = useState<LogMessage[]>([])

    const ws = useRef<WebSocket | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<
        'connecting' | 'connected' | 'open' | 'closed' | 'error' | 'disconnected'
    >('disconnected')

    const renderLogItem = useCallback(
        ({ item }: { item: LogMessage }) => {
            if (isExpanded) {
                return (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text
                                style={{
                                    color: COLORS.textMuted,
                                    fontVariant: ['tabular-nums'],
                                    flex: 1.5,
                                    fontSize: 12,
                                }}
                            >
                                {format(new Date(item.ts), 'MMM dd HH:mm:ss')}
                            </Text>

                            {item.section in SECTIONS && (
                                <Text
                                    style={{ color: COLORS.textMuted, flex: 1, fontSize: 12 }}
                                    numberOfLines={1}
                                >
                                    {SECTIONS[item.section]}
                                </Text>
                            )}
                        </View>

                        <Text
                            style={{
                                color: LOG_COLORS[
                                    (item.level as keyof typeof LOG_COLORS) || 'default'
                                ],
                            }}
                        >
                            {sanitizeLogMessage(item.message)}
                        </Text>
                    </View>
                )
            }

            return (
                <View
                    style={{
                        paddingHorizontal: 16,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Text
                            style={{
                                color: COLORS.neutral400,
                                fontVariant: ['tabular-nums'],
                                fontSize: 12,
                            }}
                        >
                            {format(new Date(item.ts), 'MMM dd HH:mm')}
                        </Text>

                        {item.section in SECTIONS && (
                            <Text
                                style={{
                                    // these are different for lisibility reasons
                                    // text is whiter when expanded
                                    color: COLORS.textMutedInverse,
                                    fontSize: 12,
                                }}
                            >
                                {SECTIONS[item.section]}
                            </Text>
                        )}

                        <Text
                            style={{
                                color: LOG_COLORS[
                                    (item.level as keyof typeof LOG_COLORS) || 'default'
                                ],
                                fontSize: 12,
                            }}
                            numberOfLines={1}
                        >
                            {sanitizeLogMessage(item.message)}
                        </Text>
                    </View>
                </View>
            )
        },
        [isExpanded]
    )

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: connectionStatus === 'connecting' || !ws.current,
            hasData: logs.length > 0,
            isError: connectionStatus === 'error',
            emptyLabel: 'No logs found',
            errorLabel: 'Failed to fetch logs',
        })
    }, [connectionStatus, logs.length])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useEffect(() => {
        if (!deploymentId) {
            console.log('No deploymentId provided')
            return
        }

        console.log('Initializing WebSocket connection for deployment:', deploymentId)
        let websocket: WebSocket | null = null

        const connectWebSocket = async () => {
            try {
                console.log('Attempting to connect to Railway WebSocket...')
                setConnectionStatus('connecting')
                websocket = await fetchSiteDeploymentLogs({ id: deploymentId })
                console.log('WebSocket connection established')

                websocket.onopen = () => {
                    console.log('WebSocket onopen event fired')
                    setConnectionStatus('open')
                }

                websocket.onclose = (event) => {
                    console.log('WebSocket connection closed:', event.code, event.reason)
                    setConnectionStatus('closed')
                }

                websocket.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    setConnectionStatus('error')
                }

                websocket.onmessage = (event) => {
                    console.log('Received WebSocket message:', event.data)
                    try {
                        const data = JSON.parse(event.data) as LogMessage
                        console.log('Parsed message data:', data)

                        if (data) {
                            setLogs((prevLogs) => {
                                const combinedLogs: LogMessage[] = [data, ...prevLogs].sort(
                                    (a, b) => a.ts - b.ts
                                )
                                // .slice(0, 1000)
                                console.log('Updated logs count:', combinedLogs.length)
                                return combinedLogs
                            })
                        } else {
                            console.log('No logs in payload')
                        }
                    } catch (error) {
                        console.error('Error parsing log message:', error)
                        console.log('Raw message:', event.data)
                    }
                }

                // Set up ping interval to keep connection alive
                const pingInterval = setInterval(() => {
                    if (websocket?.readyState === WebSocket.OPEN) {
                        console.log('Sending ping...')
                        websocket.send(JSON.stringify({ type: 'ping' }))
                    } else {
                        console.log('WebSocket not open, readyState:', websocket?.readyState)
                    }
                }, 30000)

                ws.current = websocket
                setConnectionStatus('connected')

                return () => {
                    console.log('Cleaning up ping interval')
                    clearInterval(pingInterval)
                }
            } catch (error) {
                console.error('Error connecting to WebSocket:', error)
                setConnectionStatus('error')
            }
        }

        connectWebSocket()

        return () => {
            console.log('Cleaning up WebSocket connection')
            if (websocket) {
                websocket.close()
                ws.current = null
                setConnectionStatus('disconnected')
            }
        }
    }, [deploymentId])

    return (
        <>
            <Stack.Screen
                // name="logs"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: `Logs (${connectionStatus})`,
                    headerRight: () => (
                        <HeaderTouchableOpacity
                            onPress={() => {
                                setIsExpanded((prev) => !prev)
                            }}
                        >
                            <Ionicons
                                name={isExpanded ? 'chevron-expand-outline' : 'expand-outline'}
                                size={28}
                                color={COLORS.text}
                            />
                        </HeaderTouchableOpacity>
                    ),
                }}
            />

            <FlashList
                data={logs}
                extraData={isExpanded}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                overrideProps={overrideProps}
                ListEmptyComponent={Placeholder}
                ItemSeparatorComponent={() => (
                    <View
                        style={{
                            marginVertical: isExpanded ? 8 : 4,
                            height: 1,
                            backgroundColor: isExpanded ? COLORS.hr : undefined,
                        }}
                    />
                )}
                renderItem={renderLogItem}
            />
            <LinearGradient
                colors={['rgba(1,1,1,0)', 'rgba(1,1,1,1)']}
                style={{
                    height: 30,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                }}
            />
        </>
    )
}
