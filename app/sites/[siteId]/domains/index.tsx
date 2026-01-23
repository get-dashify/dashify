import { setAliasDomains, setCustomDomain } from '@/api/mutations'
import { fetchSiteDomains } from '@/api/queries'
import ActivityIndicator from '@/components/base/ActivityIndicator'
import { HeaderTouchableOpacity } from '@/components/base/HeaderTouchableOpacity'
import buildPlaceholder from '@/components/base/Placeholder'
import RefreshControl from '@/components/base/RefreshControl'
import { useFlashlistProps } from '@/lib/hooks'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { FlashList } from '@shopify/flash-list'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import { useGlobalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useMemo } from 'react'
import { Alert, Text, View } from 'react-native'
import ContextMenu, { type ContextMenuAction } from 'react-native-context-menu-view'

const LABEL_FOR_TYPE = {
    'primary': '★ Primary domain',
    'primary-redirect': 'Redirects automatically to primary domain',
    'default': 'Netlify subdomain',
    'alias': 'Domain alias',
} as const

export default function SiteDomainsScreen() {
    const { siteId } = useGlobalSearchParams<{ siteId: string }>()
    const navigation = useNavigation()

    const siteDomainsQuery = useQuery({
        queryKey: ['sites', siteId, 'domains'],
        queryFn: () => fetchSiteDomains({ id: siteId }),
    })

    const setCustomDomainMutation = useMutation({
        mutationFn: (domain: string | null) => {
            return setCustomDomain({ siteId, domain })
        },
        onSuccess: () => {
            siteDomainsQuery.refetch()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const setAliasDomainsMutation = useMutation({
        mutationFn: (aliases: string[]) => {
            return setAliasDomains({ siteId, aliases })
        },
        onSuccess: () => {
            siteDomainsQuery.refetch()
        },
        onError: (error) => {
            Alert.alert('Error', error.message)
        },
    })

    const domainsArray = useMemo(() => {
        if (!siteDomainsQuery.data) return []

        const domains: { name: string; type: keyof typeof LABEL_FOR_TYPE }[] = []

        if (siteDomainsQuery.data?.defaultDomain) {
            domains.push({
                name: siteDomainsQuery.data.defaultDomain,
                type: 'default',
            })
        }

        if (siteDomainsQuery.data?.customDomain) {
            domains.push({
                name: siteDomainsQuery.data.customDomain,
                type: 'primary',
            })

            if (siteDomainsQuery.data.customDomain.split('.').length === 2) {
                domains.push({
                    name: `www.${siteDomainsQuery.data.customDomain}`,
                    type: 'primary-redirect',
                })
            }
        }

        if (siteDomainsQuery.data?.aliases?.length > 0) {
            for (const alias of siteDomainsQuery.data.aliases) {
                domains.push({
                    name: alias,
                    type: 'alias',
                })
            }
        }

        return domains
    }, [siteDomainsQuery.data])

    const Placeholder = useMemo(() => {
        return buildPlaceholder({
            isLoading: siteDomainsQuery.isLoading,
            hasData: domainsArray.length > 0,
            isError: siteDomainsQuery.isError,
            emptyLabel: 'No domains found',
            errorLabel: 'Failed to fetch domains',
        })
    }, [siteDomainsQuery.isLoading, domainsArray.length, siteDomainsQuery.isError])
    const { overrideProps } = useFlashlistProps(Placeholder)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: 'Domains',
            headerRight:
                setCustomDomainMutation.isPending || setAliasDomainsMutation.isPending
                    ? () => <ActivityIndicator size="small" />
                    : () => (
                          <HeaderTouchableOpacity
                              onPress={() => {
                                  Alert.prompt('Add Domain', 'Enter the domain you want to add', [
                                      {
                                          text: 'Cancel',
                                          style: 'cancel',
                                      },
                                      {
                                          text: 'Add',
                                          onPress: (domain?: string) => {
                                              if (!domain) return

                                              if (siteDomainsQuery.data?.customDomain) {
                                                  // if we have a custom domain already, it means we'll be adding an alias
                                                  setAliasDomainsMutation.mutate([
                                                      ...(siteDomainsQuery.data?.aliases || []),
                                                      domain,
                                                  ])
                                              } else {
                                                  setCustomDomainMutation.mutate(domain)
                                              }
                                          },
                                      },
                                  ])
                              }}
                          >
                              <Ionicons
                                  name={isLiquidGlassAvailable() ? 'add' : 'add-circle'}
                                  size={36}
                                  color={isLiquidGlassAvailable() ? COLORS.white : COLORS.teal}
                              />
                          </HeaderTouchableOpacity>
                      ),
        })
    }, [navigation, setCustomDomainMutation, setAliasDomainsMutation, siteDomainsQuery.data])

    return (
        <FlashList
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={<RefreshControl onRefresh={siteDomainsQuery.refetch} />}
            showsVerticalScrollIndicator={false}
            data={domainsArray}
            // ListHeaderComponent={
            //     <View style={{ padding: 16, gap: 12 }}>
            //         <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '600' }}>
            //             {JSON.stringify(siteDomainsQuery.data.domains, null, 2)}
            //         </Text>
            //     </View>
            // }
            overrideProps={overrideProps}
            ListEmptyComponent={Placeholder}
            renderItem={({ item: domain, index: domainIndex }) => {
                const actions: ContextMenuAction[] = []

                if (domain.type === 'alias') {
                    actions.push({
                        title: 'Delete',
                        systemIcon: 'trash',
                        destructive: true,
                    })
                } else if (domain.type === 'primary') {
                    if ((siteDomainsQuery.data?.aliases?.length || 0) > 0) {
                        actions.push({
                            title: 'Delete',
                            systemIcon: 'trash',
                            subtitle: 'Cannot remove while domain aliases are present.',
                            disabled: true,
                            destructive: true,
                        })
                    } else {
                        actions.push({
                            title: 'Delete',
                            systemIcon: 'trash',
                            destructive: true,
                        })
                    }
                }

                return (
                    <ContextMenu
                        dropdownMenuMode={true}
                        actions={actions}
                        onPress={(e) => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)

                            if (e.nativeEvent.name === 'Delete') {
                                Alert.alert(
                                    'Delete',
                                    'Are you sure you want to delete this domain?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete',
                                            style: 'destructive',
                                            onPress: () => {
                                                if (domain.type === 'primary') {
                                                    setCustomDomainMutation.mutate(null)
                                                } else {
                                                    setAliasDomainsMutation.mutate(
                                                        siteDomainsQuery.data?.aliases?.filter(
                                                            (alias) => alias !== domain.name
                                                        ) || []
                                                    )
                                                }
                                            },
                                        },
                                    ]
                                )
                            }
                        }}
                    >
                        <View
                            style={{
                                backgroundColor:
                                    domainIndex % 2 === 0 ? COLORS.bgDarker : undefined,
                                flexDirection: 'column',
                                padding: 16,
                                gap: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: COLORS.text,
                                    fontSize: 16,
                                    fontWeight: '600',
                                }}
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {domain.name}
                            </Text>
                            <Text style={{ color: COLORS.textMuted }}>
                                {LABEL_FOR_TYPE[domain.type]}
                            </Text>
                        </View>
                    </ContextMenu>
                )
            }}
        />
    )
}
