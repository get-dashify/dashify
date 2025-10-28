// https://www.npmjs.com/package/openapi-typescript

import type { paths } from '@/lib/netlify/schema'
import { useStore } from '@/store/default'
import { usePersistedStore } from '@/store/persisted'
import createClient from 'openapi-fetch'

// import createClient from "openapi-fetch";
// import { paths } from "./generated/schema";

// const client = createClient<paths>();

// const res = await client.GET('/accounts').then(r => r.data);

function netlify({ connectionId }: { connectionId?: string } = {}) {
    const { currentClient, setCurrentClient } = useStore.getState()

    if (!currentClient) {
        const currentConnection = connectionId
            ? usePersistedStore.getState().connections.find((c) => c.id === connectionId)
            : usePersistedStore.getState().currentConnection

        if (!currentConnection) {
            throw new Error('No connection found')
        }

        const newClient = createClient<paths>({
            baseUrl: 'https://app.netlify.com/access-control/bb-api/api/v1',
            headers: {
                Authorization: `Bearer ${currentConnection.apiToken}`,
            },
        })

        setCurrentClient(newClient)
        return newClient
    }

    return currentClient
}

export default netlify
