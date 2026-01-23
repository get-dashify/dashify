import { queryClient } from '@/lib/query'
import WidgetKitModule from '@/modules/widgetkit'
import { usePersistedStore } from '@/store/persisted'
import { useGlobalSearchParams } from 'expo-router'
import { useUser } from 'expo-superwall'
import type React from 'react'
import { useEffect } from 'react'

export function WidgetSyncer({ children }: { children: React.ReactNode }) {
    const { subscriptionStatus } = useUser()
    const connections = usePersistedStore((state) => state.connections)
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const switchConnection = usePersistedStore((state) => state.switchConnection)
    const { _widgetConnectionId } = useGlobalSearchParams<{ _widgetConnectionId?: string }>()

    useEffect(() => {
        if (_widgetConnectionId && _widgetConnectionId !== currentConnection?.id) {
            switchConnection({ connectionId: _widgetConnectionId })
            queryClient.resetQueries()
        }
    }, [_widgetConnectionId, currentConnection?.id, switchConnection])

    useEffect(() => {
        if (subscriptionStatus.status === 'UNKNOWN') {
            return
        }
        WidgetKitModule.setIsSubscribed(__DEV__ || subscriptionStatus.status !== 'INACTIVE')
    }, [subscriptionStatus.status])

    useEffect(() => {
        WidgetKitModule.setConnections(connections)
    }, [connections])

    return <>{children}</>
}
