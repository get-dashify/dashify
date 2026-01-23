import { fetchEdgeFunctionLogs, fetchFunctionLogs } from '@/api/queries'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useGlobalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-native'

export const COLOR_FOR_LEVEL = {
    error: COLORS.red500,
    info: COLORS.blue500,
    debug: COLORS.text,
    ERROR: COLORS.red500,
    INFO: COLORS.blue500,
    DEBUG: COLORS.text,
    '': COLORS.text,
}

export const COLOR_FOR_TYPE = {
    edge: COLORS.green500,
    fn: COLORS.pink500,
}

type SortedEnrichedLogs = EnrichedLog[]

type EnrichedLog = {
    type: 'fn' | 'edge'
} & (
    | Awaited<ReturnType<typeof fetchFunctionLogs>>['logs'][number]
    | Awaited<ReturnType<typeof fetchEdgeFunctionLogs>>['logs'][number]
)

export default function Logs() {
    const { siteId } = useGlobalSearchParams<{ siteId: string }>()
    const navigation = useNavigation()

    const [isExpanded, setIsExpanded] = useState(false)

    const functionLogsQuery = useQuery({
        queryKey: ['site', siteId, 'function-logs'],
        queryFn: () =>
            fetchFunctionLogs({
                siteId,
            }),
        enabled: !!siteId,
    })

    const edgeFunctionLogsQuery = useQuery({
        queryKey: ['site', siteId, 'edge-function-logs'],
        queryFn: () =>
            fetchEdgeFunctionLogs({
                siteId,
            }),
        enabled: !!siteId,
    })

    useLayoutEffect(() => {
        navigation.setOptions({
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
        })
    }, [navigation, isExpanded])

    const sortedEnrichedLogs = useMemo(() => {
        const enrichedLogs = [
            ...(functionLogsQuery.data?.logs || []).map((log) => ({
                ...log,
                type: 'fn',
            })),
            ...(edgeFunctionLogsQuery.data?.logs || []).map((log) => ({
                ...log,
                type: 'edge',
            })),
        ]

        return enrichedLogs.sort((a, b) => b.ts - a.ts) as SortedEnrichedLogs
    }, [functionLogsQuery.data?.logs, edgeFunctionLogsQuery.data?.logs])

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: functionLogsQuery.isLoading || edgeFunctionLogsQuery.isLoading,
            hasData: sortedEnrichedLogs.length > 0,
            emptyLabel: 'No logs found',
            isError: functionLogsQuery.isError || edgeFunctionLogsQuery.isError,
            errorLabel: 'Failed to fetch logs',
        })
    }, [
        functionLogsQuery.isLoading,
        functionLogsQuery.isError,
        edgeFunctionLogsQuery.isLoading,
        edgeFunctionLogsQuery.isError,
        sortedEnrichedLogs.length,
    ])
    const { overrideProps } = useFlashlistProps(Placeholder)

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    onRefresh={async () => {
                        await Promise.all([
                            functionLogsQuery.refetch(),
                            edgeFunctionLogsQuery.refetch(),
                        ])
                    }}
                />
            }
            overrideProps={overrideProps}
            ListEmptyComponent={Placeholder}
            data={sortedEnrichedLogs}
            extraData={isExpanded}
            renderItem={({ item: log, index: logIndex }) => (
                <LogListRow
                    log={log}
                    backgroundColor={logIndex % 2 === 0 ? COLORS.bgDarker : undefined}
                    isExpanded={isExpanded}
                />
            )}
        />
    )
}

function LogListRow({
    log,
    backgroundColor,
    isExpanded,
}: { log: EnrichedLog; backgroundColor?: string; isExpanded?: boolean }) {
    return (
        <View
            style={{
                padding: 16,
                backgroundColor,
                flexDirection: 'column',
                gap: 10,
            }}
        >
            {/* Summary Row */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    gap: 10,
                }}
            >
                {/* Timestamp */}
                <Text
                    style={{
                        width: '38%',
                        fontSize: 12,
                        color: COLORS.text,
                    }}
                >
                    {format(log.ts, 'd MMM hh:mm:ss a')}
                </Text>

                {/* Type */}
                <Text
                    style={{
                        width: '12%',
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                        color: COLOR_FOR_TYPE[log.type],
                    }}
                >
                    {log.type.toUpperCase()}
                </Text>

                {/* Request ID */}
                <Text
                    style={{
                        width: '24%',
                        fontSize: 12,
                        color: COLORS.text,
                    }}
                    numberOfLines={1}
                >
                    {log.netlify_request_id.slice(0, 8)}
                </Text>

                {/* Level */}
                <Text
                    style={{
                        width: '26%',
                        fontSize: 12,
                        color: COLOR_FOR_LEVEL[log.level],
                    }}
                    numberOfLines={1}
                >
                    {log.level.toUpperCase()}
                </Text>
            </View>

            {/* Expanded Message */}
            {isExpanded && <Text style={{ fontSize: 12, color: COLORS.text }}>{log.message}</Text>}
        </View>
    )
}
