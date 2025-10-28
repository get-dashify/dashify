import { fetchFormSubmissions } from '@/api/queries'
import HeaderItem from '@/components/base/HeaderItem'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system/legacy'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { useLayoutEffect, useMemo } from 'react'
import { ActivityIndicator, Alert, Text, View } from 'react-native'

export default function FormSubmissionsScreen() {
    const navigation = useNavigation()
    const { formId } = useLocalSearchParams<{ formId: string }>()

    const submissionsQuery = useQuery({
        queryKey: ['form', formId, 'submissions'],
        queryFn: () => fetchFormSubmissions({ id: formId }),
    })

    const downloadFormMutation = useMutation({
        mutationFn: async () => {
            try {
                const submissions = submissionsQuery.data

                if (!submissions || submissions.length === 0) {
                    Alert.alert('No Data', 'There are no submissions to download.')
                    return
                }

                // Get all unique field names from all submissions
                const allFields = new Set<string>()
                for (const submission of submissions) {
                    if (submission.data) {
                        for (const key of Object.keys(submission.data)) {
                            if (!['ip', 'user_agent'].includes(key)) {
                                allFields.add(key)
                            }
                        }
                    }
                }

                // Add created_at to fields
                const fieldNames = [...Array.from(allFields), 'created_at']

                // Create CSV header
                const csvHeader = fieldNames.map((field) => `"${field}"`).join(',')

                // Create CSV rows
                const csvRows = submissions.map((submission) => {
                    return fieldNames
                        .map((field) => {
                            if (field === 'created_at') {
                                return `"${submission.created_at || ''}"`
                            }
                            const value = submission.data?.[field] || ''
                            // Escape quotes and wrap in quotes
                            const escapedValue = String(value).replace(/"/g, '""')
                            return `"${escapedValue}"`
                        })
                        .join(',')
                })

                // Combine header and rows
                const csv = [csvHeader, ...csvRows].join('\n')

                // Write to file
                const fileName = `form-submissions-${formId}-${Date.now()}.csv`
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`

                await FileSystem.writeAsStringAsync(fileUri, csv, {
                    encoding: FileSystem.EncodingType.UTF8,
                })

                // Share/open the file
                if (await Sharing.isAvailableAsync()) {
                    Sharing.shareAsync(fileUri, {
                        mimeType: 'text/csv',
                        dialogTitle: 'Form Submissions',
                        UTI: 'public.comma-separated-values-text',
                    })
                } else {
                    Alert.alert('Error', 'Sharing is not available on this device')
                }
            } catch (error) {
                console.error('Error downloading form submissions:', error)
                Alert.alert('Error', 'Failed to download form submissions. Please try again.')

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            }
        },
    })

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: submissionsQuery.isLoading,
            hasData: submissionsQuery.data && submissionsQuery.data.length > 0,
            isError: submissionsQuery.isError,
            emptyLabel: 'No submissions found',
            errorLabel: 'Failed to fetch submissions',
        })
    }, [submissionsQuery.isLoading, submissionsQuery.isError, submissionsQuery.data])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: downloadFormMutation.isPending
                ? () => (
                      <HeaderItem>
                          <ActivityIndicator size="small" color={COLORS.text} />
                      </HeaderItem>
                  )
                : () => (
                      <HeaderTouchableOpacity
                          onPress={() => {
                              downloadFormMutation.mutate()
                          }}
                      >
                          <Ionicons name="download" size={36} color={COLORS.teal} />
                      </HeaderTouchableOpacity>
                  ),
        })
    }, [navigation, downloadFormMutation.isPending, downloadFormMutation.mutate])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={<RefreshControl onRefresh={submissionsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={submissionsQuery.data}
            overrideProps={overrideProps}
            ListEmptyComponent={Placeholder}
            renderItem={({ item: submission, index: submissionIndex }) => (
                <View
                    style={{
                        backgroundColor: submissionIndex % 2 === 0 ? COLORS.bgDark : undefined,
                        padding: 16,
                        flexDirection: 'column',
                        gap: 8,
                    }}
                >
                    {submission.data &&
                        [...Object.entries(submission.data), ['created_at', submission.created_at!]]
                            .filter(([key]) => !['ip', 'user_agent'].includes(key))
                            .map(([key, value]) => (
                                <View
                                    key={key}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 14, color: COLORS.textMuted, flex: 2 }}
                                    >
                                        {key}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: COLORS.text,
                                            flex: 5,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {typeof value === 'string' ? value : 'FILE/DATA'}
                                    </Text>
                                </View>
                            ))}
                </View>
            )}
        />
    )
}
