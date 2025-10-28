import { mmkvStorage } from '@/lib/storage'
import WidgetKitModule from '@/modules/widgetkit'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Connection {
    id: string
    email: string
    apiToken: string
    currentAccountId: string | null
    currentAccountSlug: string | null
}

interface PersistedStoreState {
    connections: Connection[]
    currentConnection: Connection | null
    switchConnection: (
        props:
            | {
                  connectionId: string
              }
            | {
                  connectionId: string
                  accountId: string
                  accountSlug: string
              }
    ) => void
    removeConnection: (connectionId: string) => void
    addConnection: (connection: Connection) => void

    countToReviewPrompt: number
    setCountToReviewPrompt: (count: number) => void
    lastShownReviewPrompt: number | null
    setLastShownReviewPrompt: (ts: number) => void

    acknowledgedSwipeLeft: boolean
    acknowledgeSwipeLeft: () => void

    hasSeenOnboarding: boolean
    installTs: number
}

export const usePersistedStore = create<PersistedStoreState>()(
    persist(
        (set, get) => ({
            connections: [],
            currentConnection: null,
            removeConnection: (connectionId: string) => {
                WidgetKitModule.removeConnection(connectionId)
                const newConnections = get().connections.filter((c) => c.id !== connectionId)

                set({
                    connections: newConnections,
                    currentConnection: newConnections[0] || null,
                })
            },
            addConnection: (connection: Connection) => {
                WidgetKitModule.addConnection(connection)
                set((state) => ({
                    connections: [...state.connections, connection],
                }))
            },
            switchConnection: (
                props:
                    | {
                          connectionId: string
                      }
                    | {
                          connectionId: string
                          accountId: string
                          accountSlug: string
                      }
            ) => {
                const state = get()

                const connection = state.connections.find((c) => c.id === props.connectionId)
                if (!connection) return

                const newConnection = {
                    ...connection,
                    currentAccountId:
                        'accountId' in props ? props.accountId : connection.currentAccountId,
                    currentAccountSlug:
                        'accountSlug' in props ? props.accountSlug : connection.currentAccountSlug,
                }

                const newConnections = state.connections.map((c) =>
                    c.id === newConnection.id ? newConnection : c
                )

                set({
                    connections: newConnections,
                    currentConnection: newConnection,
                })

                // queryClient.invalidateQueries()
            },

            countToReviewPrompt: 12,
            setCountToReviewPrompt: (count: number) => {
                set({ countToReviewPrompt: count })
            },
            lastShownReviewPrompt: null,
            setLastShownReviewPrompt: (ts: number) => {
                set({ lastShownReviewPrompt: ts })
            },

            acknowledgedSwipeLeft: false,
            acknowledgeSwipeLeft: () => {
                set({ acknowledgedSwipeLeft: true })
            },

            hasSeenOnboarding: false,
            installTs: Date.now(),
        }),
        {
            name: 'dashify-persisted-store',
            storage: createJSONStorage(() => mmkvStorage),
            version: 1,
        }
    )
)
