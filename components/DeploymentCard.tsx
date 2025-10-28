import type { components } from '@/lib/netlify/schema'
import { COLORS } from '@/theme/colors'
import Octicons from '@expo/vector-icons/Octicons'
import { format } from 'date-fns'
import { upperFirst } from 'lodash'
import { useMemo } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

const COLOR_FOR_BUILD_STATUS: Record<
    Required<components['schemas']['deploy']>['state'] | '',
    string
> = {
    ready: COLORS.greenDarker,
    building: COLORS.goldDarker,
    error: COLORS.redDarker,
    rejected: COLORS.redDarker,
    new: COLORS.goldDarker,
    pending_review: COLORS.goldDarker,
    accepted: COLORS.goldDarker,
    enqueued: COLORS.goldDarker,
    uploading: COLORS.goldDarker,
    uploaded: COLORS.goldDarker,
    preparing: COLORS.goldDarker,
    prepared: COLORS.goldDarker,
    processing: COLORS.goldDarker,
    processed: COLORS.greenDarker,
    retrying: COLORS.goldDarker,
    '': COLORS.grayDarker,
}

function getGitAuthorAvatar(committer: string) {
    return `https://github.com/${committer}.png`
}

export default function DeploymentCard({
    deployment,
    onPress,
    children,
}: {
    deployment: components['schemas']['deploy']
    onPress: () => void
    children?: React.ReactNode
}) {
    const subtitle = useMemo(() => {
        if (!deployment) return null

        if (deployment.title) {
            if (deployment.committer) {
                return (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Image
                            source={{
                                uri: getGitAuthorAvatar(deployment.committer),
                            }}
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                            }}
                        />
                        <Text
                            style={{
                                color: COLORS.text,
                                fontSize: 12,
                                paddingRight: 20,
                            }}
                            numberOfLines={1}
                        >
                            {deployment.title}
                        </Text>
                    </View>
                )
            }
            return (
                <Text
                    style={{
                        color: COLORS.text,
                        fontSize: 12,
                        paddingRight: 20,
                    }}
                    numberOfLines={1}
                >
                    {deployment.title}
                </Text>
            )
        }

        if (deployment.error_message) {
            return (
                <Text
                    style={{
                        color: COLORS.text,
                        fontSize: 12,
                        paddingRight: 20,
                    }}
                    numberOfLines={1}
                >
                    {deployment.error_message}
                </Text>
            )
        }

        if (deployment.commit_message) {
            if (deployment.committer) {
                return (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Image
                            source={{
                                uri: getGitAuthorAvatar(deployment.committer),
                            }}
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                            }}
                        />
                        <Text
                            style={{
                                color: COLORS.text,
                                fontSize: 12,
                                paddingRight: 20,
                            }}
                            numberOfLines={1}
                        >
                            {deployment.commit_message}
                        </Text>
                    </View>
                )
            }
            return (
                <Text
                    style={{
                        color: COLORS.text,
                        fontSize: 12,
                        paddingRight: 20,
                    }}
                    numberOfLines={1}
                >
                    {deployment.commit_message}
                </Text>
            )
        }

        if (deployment.committer) {
            return (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    <Image
                        source={{
                            uri: getGitAuthorAvatar(deployment.committer),
                        }}
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                        }}
                    />
                    <Text
                        style={{
                            color: COLORS.text,
                            fontSize: 12,
                            paddingRight: 20,
                        }}
                        numberOfLines={1}
                    >
                        {deployment.committer}
                    </Text>
                </View>
            )
        }

        return (
            <Text style={{ color: COLORS.text, fontSize: 12, paddingRight: 20 }}>
                No commit message
            </Text>
        )
    }, [deployment])

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                gap: 10,
                padding: 16,
                backgroundColor: COLORS.bgDark,
                borderRadius: 16,
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Octicons
                        name="dot-fill"
                        size={24}
                        color={COLOR_FOR_BUILD_STATUS[deployment?.state || '']}
                    />
                    <Text
                        style={{
                            color: COLORS.text,
                            fontSize: 14,
                        }}
                    >
                        {upperFirst(deployment?.context ?? 'No target')}
                    </Text>
                </View>

                {deployment?.created_at && (
                    <Text
                        style={{
                            color: COLORS.text,
                            fontSize: 12,
                            fontWeight: '500',
                        }}
                    >
                        {format(deployment?.created_at, 'dd/MM/yyyy')}
                        {/* 11/06/2025 */}
                    </Text>
                )}
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.hr }} />

            <View
                style={{
                    gap: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Octicons name="git-branch" size={20} color={COLORS.text} />
                <View
                    style={{
                        gap: 2,
                        justifyContent: 'space-between',
                    }}
                >
                    {deployment?.branch ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text
                                style={{
                                    color: COLORS.text,
                                    fontSize: 14,
                                }}
                            >
                                {deployment?.branch}
                            </Text>
                            {deployment?.commit_ref && (
                                <Text
                                    style={{
                                        color: COLORS.text,
                                        fontSize: 12,
                                    }}
                                >
                                    (#{deployment?.commit_ref.substring(0, 7)})
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text
                            style={{
                                color: COLORS.text,
                                fontSize: 14,
                            }}
                        >
                            No source control
                        </Text>
                    )}
                    {subtitle}
                </View>
            </View>

            {children}
        </TouchableOpacity>
    )
}
