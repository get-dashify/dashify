import { fetchAccountSites } from '@/api/queries'
import SiteCard from '@/components/SiteCard'
import { usePersistedStore } from '@/store/persisted'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export default function SitesAllScreen() {
    const currentConnection = usePersistedStore((state) => state.currentConnection)
    const currentAccountId = useMemo(() => currentConnection?.currentAccountId, [currentConnection])

    const accountSitesQuery = useQuery({
        queryKey: ['sites', currentAccountId, 'all'],
        queryFn: () => fetchAccountSites(),
        enabled: !!currentAccountId,
    })

    return (
        <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            nestedScrollEnabled={true}
            style={{ flex: 1 }}
            contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 14,
                padding: 16,
                paddingBottom: 32,
            }}
        >
            {accountSitesQuery.data?.map((site) => (
                <SiteCard
                    site={site}
                    key={site.id}
                    onPress={() => {
                        router.back()
                    }}
                />
            ))}
        </ScrollView>
    )
}
