import { paths } from '@/lib/netlify/generated/schema'
import { Client } from 'openapi-fetch'
import { create } from 'zustand'

interface StoreState {
    number: number
    increment: () => void
    decrement: () => void

    currentClient: Client<paths, `${string}/${string}`> | null
    setCurrentClient: (client: Client<paths, `${string}/${string}`>) => void
}

export const useStore = create<StoreState>()((set, get) => ({
    number: 0,
    increment: () => {
        set((state) => ({ number: state.number + 1 }))
    },
    decrement: () => {
        set((state) => ({ number: state.number - 1 }))
    },
    currentClient: null,
    setCurrentClient: (client: Client<paths, `${string}/${string}`>) => {
        set({ currentClient: client })
    },
}))
