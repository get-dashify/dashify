import { deleteSite, redeploySite } from '@/api/mutations'
import { fetchBlockedWebRequests, fetchSite, fetchSiteDeployments } from '@/api/queries'
import DeploymentCard from '@/components/DeploymentCard'
import SiteFirewallCard from '@/components/SiteFirewallCard'
import SiteWidgetMessage from '@/components/SiteWidgetMessage'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { queryClient } from '@/lib/query'
import { usePersistedStore } from '@/store/persisted'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo } from 'react'
import { Alert, TouchableOpacity, View } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'

export default function SiteHomeScreen() {
    const { siteId } = useLocalSearchParams<{ siteId: string }>()

    const navigation = useNavigation()

    const acknowledgedSwipeLeft = usePersistedStore((state) => state.acknowledgedSwipeLeft)
    const acknowledgeSwipeLeft = usePersistedStore((state) => state.acknowledgeSwipeLeft)

    const siteQuery = useQuery({
        queryKey: ['sites', siteId],
        queryFn: () => fetchSite({ id: siteId }),
    })

    const siteDeploymentsQuery = useQuery({
        queryKey: ['sites', siteId, 'deployments'],
        queryFn: () => fetchSiteDeployments({ id: siteId }),
    })

    const siteBlockedWebRequestsQuery = useQuery({
        queryKey: ['sites', siteId, 'blocked-web-requests'],
        queryFn: () => fetchBlockedWebRequests({ siteId }),
    })

    console.log('siteBlockedWebRequestsQuery.data', siteBlockedWebRequestsQuery.data)

    const deployMutation = useMutation({
        mutationFn: (clearCache: boolean) => redeploySite({ siteId, clearCache }),
        onSuccess: () => {
            siteDeploymentsQuery.refetch()
        },
        onError: (error) => {
            console.error(error)
            Alert.alert('Error', error.message)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => deleteSite({ siteId }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['sites'] })
            router.back()
        },
        onError: (error) => {
            console.error(error)
            Alert.alert('Error', error.message)
        },
    })

    const Placeholder = useMemo(() => {
        const emptySite = buildPlaceholder({
            isLoading: siteQuery.isLoading,
            hasData: !!siteQuery.data,
            emptyLabel: 'No site found',
            isError: siteQuery.isError,
            errorLabel: 'Failed to fetch site',
        })

        if (emptySite) return emptySite

        const emptySiteDeployments = buildPlaceholder({
            isLoading: siteDeploymentsQuery.isLoading,
            hasData: siteDeploymentsQuery.data && siteDeploymentsQuery.data.length > 0,
            emptyLabel: 'No deployments found',
            isError: siteDeploymentsQuery.isError,
            errorLabel: 'Failed to fetch deployments',
        })

        return emptySiteDeployments
    }, [
        siteQuery.isLoading,
        siteQuery.data,
        siteQuery.isError,
        siteDeploymentsQuery.isLoading,
        siteDeploymentsQuery.data,
        siteDeploymentsQuery.isError,
    ])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useLayoutEffect(() => {
        // this changes the visual title of the page
        if (siteQuery.data?.name) {
            navigation.setOptions({
                title: siteQuery.data.name,
                headerRight:
                    deployMutation.isPending || deleteMutation.isPending
                        ? () => <ActivityIndicator size="small" />
                        : () => (
                              <ContextMenu
                                  dropdownMenuMode={true}
                                  actions={[
                                      {
                                          title: 'Close',
                                          systemIcon: 'xmark',
                                      },
                                      {
                                          title: 'Visit',
                                          systemIcon: 'globe',
                                      },
                                      {
                                          title: 'Deploy site',
                                          systemIcon: 'arrow.counterclockwise',
                                      },
                                      {
                                          title: 'Clear cache and deploy site',
                                          systemIcon: 'arrow.counterclockwise',
                                      },
                                      {
                                          title: 'Delete',
                                          systemIcon: 'trash',
                                          destructive: true,
                                      },
                                  ]}
                                  onPress={(e) => {
                                      if (e.nativeEvent.name === 'Close') {
                                          if (!acknowledgedSwipeLeft) {
                                              acknowledgeSwipeLeft()
                                              Alert.alert(
                                                  'Quick Tip',
                                                  'You can swipe left to go back!',
                                                  [{ text: 'Good to know!', style: 'cancel' }]
                                              )
                                          }
                                          if (router.canGoBack()) {
                                              router.back()
                                          } else {
                                              router.replace('/home')
                                          }
                                          return
                                      }

                                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)

                                      if (e.nativeEvent.name === 'Visit') {
                                          if (siteQuery.data?.ssl_url) {
                                              try {
                                                  Linking.openURL(siteQuery.data.ssl_url)
                                              } catch {
                                                  Alert.alert(
                                                      'Error',
                                                      'Failed to open link, please try again.'
                                                  )
                                              }
                                          }
                                          return
                                      }

                                      if (e.nativeEvent.name === 'Deploy site') {
                                          deployMutation.mutate(false)
                                          return
                                      }

                                      if (e.nativeEvent.name === 'Clear cache and deploy site') {
                                          deployMutation.mutate(true)
                                          return
                                      }

                                      if (e.nativeEvent.name === 'Delete') {
                                          Alert.alert(
                                              'Are you sure?',
                                              'This action cannot be undone.',
                                              [
                                                  { text: 'Cancel', style: 'cancel' },
                                                  {
                                                      text: 'Delete',
                                                      style: 'destructive',
                                                      onPress: () => {
                                                          Alert.alert(
                                                              'Are you super duper sure?',
                                                              'The site will be deleted and cannot be recovered.',
                                                              [
                                                                  {
                                                                      text: 'Cancel',
                                                                      style: 'cancel',
                                                                  },
                                                                  {
                                                                      text: 'Delete site',
                                                                      style: 'destructive',
                                                                      onPress: () => {
                                                                          deleteMutation.mutate()
                                                                      },
                                                                  },
                                                              ]
                                                          )
                                                      },
                                                  },
                                              ]
                                          )
                                          return
                                      }
                                  }}
                              >
                                  <TouchableOpacity
                                      style={
                                          isLiquidGlassAvailable()
                                              ? {
                                                    height: 36,
                                                    width: 36,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }
                                              : {
                                                    backgroundColor: COLORS.neutral800,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    borderRadius: 16,
                                                    height: 36,
                                                    width: 36,
                                                }
                                      }
                                  >
                                      <Ionicons
                                          name="ellipsis-horizontal-sharp"
                                          size={isLiquidGlassAvailable() ? 32 : 28}
                                          color={COLORS.text}
                                      />
                                  </TouchableOpacity>
                              </ContextMenu>
                          ),
            })
        }
    }, [
        siteQuery.data,
        navigation,
        deployMutation,
        deleteMutation,
        acknowledgedSwipeLeft,
        acknowledgeSwipeLeft,
    ])

    return (
        <>
            <Stack.Screen
                // name="index"
                options={{
                    // this changes the navigation title that appears next to "Back"
                    title: siteQuery.data?.name || 'Site',
                }}
            />
            <FlashList
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingBottom: 16,
                }}
                data={siteDeploymentsQuery.data}
                refreshControl={
                    <RefreshControl
                        onRefresh={async () => {
                            await Promise.all([
                                siteQuery.refetch(),
                                siteDeploymentsQuery.refetch(),
                                siteBlockedWebRequestsQuery.refetch(),
                            ])
                        }}
                    />
                }
                overrideProps={overrideProps}
                ListHeaderComponent={() => (
                    <View
                        style={{
                            paddingHorizontal: 16,
                            paddingBottom: 20,
                            flexDirection: 'column',
                            gap: 12,
                        }}
                    >
                        <SiteWidgetMessage />
                        <SiteFirewallCard />
                        {/* <ProjectQuickActions /> */}
                    </View>
                )}
                ListEmptyComponent={Placeholder}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                renderItem={({ item }) => (
                    // this is now needed due to overriding the `contentContainerStyle`
                    // setting padding inside pushes the cards to the right
                    <View style={{ paddingHorizontal: 16 }}>
                        <DeploymentCard
                            deployment={item}
                            onPress={() => {
                                router.push(`/deployments/${item.id}`)
                            }}
                        />
                    </View>
                )}
            />
        </>
    )
}
