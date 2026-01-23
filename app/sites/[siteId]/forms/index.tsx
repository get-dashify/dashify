import { fetchSiteForms } from '@/api/queries'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { FlashList } from '@shopify/flash-list'
import { useQuery } from '@tanstack/react-query'
import { router, useGlobalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

// site.processing_settings.ignore_html_forms

export default function Forms() {
    const { siteId } = useGlobalSearchParams<{ siteId: string }>()

    const [_siteId, _setSiteId] = useState<string | null>(null)

    useEffect(() => {
        if (!siteId) return
        if (_siteId === siteId) return
        _setSiteId(siteId)
    }, [siteId, _siteId])

    const siteFormsQuery = useQuery({
        queryKey: ['sites', _siteId, 'forms'],
        queryFn: () => fetchSiteForms({ id: _siteId! }),
    })

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: siteFormsQuery.isLoading,
            hasData: siteFormsQuery.data && siteFormsQuery.data.length > 0,
            isError: siteFormsQuery.isError,
            emptyLabel: 'No forms found',
            errorLabel: 'Failed to fetch forms',
        })
    }, [siteFormsQuery.isLoading, siteFormsQuery.data, siteFormsQuery.isError])
    const { overrideProps } = useFlashlistProps(Placeholder)

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={<RefreshControl onRefresh={siteFormsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={siteFormsQuery.data}
            overrideProps={overrideProps}
            ListEmptyComponent={Placeholder}
            renderItem={({ item: form, index: formIndex }) => (
                <TouchableOpacity
                    style={{
                        backgroundColor: formIndex % 2 === 0 ? COLORS.bgDark : undefined,
                        padding: 16,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                    onPress={() => router.push(`/forms/${form.id}/`)}
                >
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 16,
                                color: COLORS.text,
                                fontWeight: '600',
                                marginBottom: 4,
                            }}
                        >
                            {form.name || 'Unnamed Form'}
                        </Text>
                        <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 2 }}>
                            {form.fields?.length || 0} fields
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: COLORS.text, fontWeight: '500' }}>
                            {form.submission_count || 0} submissions
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    )
}
