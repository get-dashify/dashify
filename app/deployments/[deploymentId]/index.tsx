import { fetchSiteDeployment, fetchSiteDeploymentSummary } from '@/api/queries'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import * as Linking from 'expo-linking'
import { type Href, Stack, router, useLocalSearchParams } from 'expo-router'
import { upperFirst } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'

function formatFrameworkName(framework?: string) {
    if (!framework) return '—'

    if (framework.includes('next')) return 'Next.js'
    if (framework.includes('react')) return 'React'
    if (framework.includes('svelte')) return 'Svelte'
    if (framework.includes('vue')) return 'Vue'
    if (framework.includes('angular')) return 'Angular'
    if (framework.includes('ember')) return 'Ember'
    if (framework.includes('laravel')) return 'Laravel'
    if (framework.includes('symfony')) return 'Symfony'
    if (framework.includes('rails')) return 'Ruby on Rails'
    if (framework.includes('django')) return 'Django'
    if (framework.includes('flask')) return 'Flask'
    if (framework.includes('express')) return 'Express'
    if (framework.includes('fastify')) return 'Fastify'
    if (framework.includes('nest')) return 'Nest.js'
    if (framework.includes('nestjs')) return 'Nest.js'
    if (framework.includes('sveltekit')) return 'SvelteKit'
    if (framework.includes('astro')) return 'Astro'
    if (framework.includes('nuxt')) return 'Nuxt.js'
    if (framework.includes('gatsby')) return 'Gatsby'

    return framework
}

export default function DeploymentScreen() {
    const { deploymentId } = useLocalSearchParams<{ deploymentId: string }>()

    const deploymentQuery = useQuery({
        queryKey: ['deploys', deploymentId],
        queryFn: () => fetchSiteDeployment({ id: deploymentId }),
    })

    const deploymentSummaryQuery = useQuery({
        queryKey: ['deploys', deploymentId, 'summary'],
        queryFn: () => fetchSiteDeploymentSummary({ id: deploymentId }),
    })

    const deployment = useMemo(() => deploymentQuery.data, [deploymentQuery.data])
    const [imageHeight, setImageHeight] = useState<number | undefined>()

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: deploymentQuery.isLoading || deploymentSummaryQuery.isLoading,
            hasData: !!deploymentQuery.data && !!deploymentSummaryQuery.data,
            emptyLabel: 'No deployment found',
            errorLabel: 'Failed to fetch deployment',
            isError: deploymentQuery.isError || deploymentSummaryQuery.isError,
        })
    }, [
        deploymentQuery.isLoading,
        deploymentSummaryQuery.isLoading,
        deploymentQuery.data,
        deploymentSummaryQuery.data,
        deploymentQuery.isError,
        deploymentSummaryQuery.isError,
    ])

    useEffect(() => {
        if (deployment?.screenshot_url) {
            Image.getSize(deployment.screenshot_url, (width, height) => {
                // Calculate height based on screen width and image aspect ratio
                const screenWidth = Dimensions.get('window').width
                const scaledHeight = (screenWidth * height) / width
                setImageHeight(scaledHeight)
            })
        }
    }, [deployment?.screenshot_url])

    // pleasing compiler
    if (Placeholder || !deployment) {
        return Placeholder
    }

    return (
        <>
            <Stack.Screen
                // name="index"
                options={{
                    headerShown: true,
                    headerLargeTitle: true,
                    title: deployment.id,
                }}
            />
            <ScrollView
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 0, flexDirection: 'column' }}
                refreshControl={<RefreshControl onRefresh={deploymentQuery.refetch} />}
            >
                {deployment.screenshot_url && (
                    <Image
                        source={{ uri: deployment.screenshot_url }}
                        style={{
                            width: '100%',
                            height: imageHeight,
                            resizeMode: 'contain',
                        }}
                    />
                )}

                <View
                    style={{
                        flexDirection: 'column',
                        gap: 0,
                    }}
                >
                    <InfoRow
                        label="Status"
                        icon="checkmark-circle-outline"
                        value={deployment.state ? upperFirst(deployment.state) : 'Unknown'}
                        backgroundColor={COLORS.bgDarker}
                    />
                    <InfoRow
                        label="Created"
                        icon="calendar-outline"
                        value={
                            deployment.created_at
                                ? formatDistanceToNow(deployment.created_at, { addSuffix: true })
                                : 'Unknown'
                        }
                    />
                    <InfoRow
                        label="Framework"
                        icon="color-wand-outline"
                        value={formatFrameworkName(deployment?.framework)}
                        backgroundColor={COLORS.bgDarker}
                    />
                    <InfoRow
                        label="Link"
                        icon="link-outline"
                        value={deployment.deploy_ssl_url?.replace('https://', '') || 'No link'}
                        onPress={
                            deployment.deploy_ssl_url
                                ? () => {
                                      try {
                                          Linking.openURL(deployment.deploy_ssl_url!)
                                      } catch {
                                          Alert.alert(
                                              'Error',
                                              'Failed to open link, please try again.'
                                          )
                                      }
                                  }
                                : undefined
                        }
                    />
                    <InfoRow
                        label="Commit"
                        icon="git-commit-outline"
                        value={deployment.commit_message || 'No commit'}
                        backgroundColor={COLORS.bgDarker}
                    />
                    <InfoRow
                        label="Branch"
                        icon="git-branch-outline"
                        value={deployment.branch || 'No branch'}
                    />

                    <ButtonRow
                        label="Files"
                        icon="folder-open-outline"
                        route={`/deployments/${deploymentId}/files`}
                        backgroundColor={COLORS.bgDarker}
                    />

                    <ButtonRow
                        label="Logs"
                        icon="terminal-outline"
                        route={`/deployments/${deploymentId}/logs`}
                    />
                </View>

                <View
                    style={{
                        flexDirection: 'column',
                        gap: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 20,
                    }}
                >
                    {/* <Text style={{ color: COLORS.text, fontSize: 16 }}>Summary</Text> */}
                    {deploymentSummaryQuery.data?.messages.map((message) => {
                        // replace all markdown links with just the text
                        let parsedDescription = message.description.replace(
                            /\[(.*?)\]\((.*?)\)/g,
                            '$1'
                        )

                        // remove everything (including) after "Learn more"
                        parsedDescription = parsedDescription.replace(/Learn more.*/, '')

                        parsedDescription = parsedDescription.replace(/Visit.*/, '')

                        return (
                            <View key={message.title} style={{ flexDirection: 'column', gap: 5 }}>
                                <Text style={{ color: COLORS.text, fontSize: 16 }}>
                                    {message.title}
                                </Text>
                                <Text style={{ color: COLORS.text, fontSize: 12 }}>
                                    {parsedDescription}
                                </Text>
                            </View>
                        )
                    })}
                </View>
            </ScrollView>
        </>
    )
}

function InfoRow({
    label,
    icon,
    value,
    backgroundColor,
    onPress,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    value: string
    backgroundColor?: string
    onPress?: () => void
}) {
    return (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: backgroundColor,
            }}
            disabled={!onPress}
            onPress={onPress}
        >
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color={COLORS.textMuted} />
                <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>{label}</Text>
            </View>
            <View style={{ flex: 3, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text
                    style={{
                        color: COLORS.text,
                        fontSize: 14,
                        textAlign: 'right',
                    }}
                    ellipsizeMode="clip"
                    numberOfLines={2}
                >
                    {value}
                </Text>
            </View>
        </TouchableOpacity>
    )
}

function ButtonRow({
    label,
    icon,
    route,
    backgroundColor,
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    route: Href
    backgroundColor?: string
}) {
    return (
        <TouchableOpacity
            onPress={() => router.push(route)}
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                width: '100%',
                backgroundColor: backgroundColor,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon} size={20} color={COLORS.textMuted} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: COLORS.textMuted }}>
                    {label}
                </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
    )
}
