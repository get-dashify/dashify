import type { fetchSiteDeploymentFiles } from '@/api/queries'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import { useCallback } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { View } from 'react-native'

export type DeploymentAsset = Awaited<ReturnType<typeof fetchSiteDeploymentFiles>>[number] & {
    children?: DeploymentAsset[]
    isExpanded?: boolean
}

const INDENT_SIZE = 20

export function FileTreeAsset({
    asset,
    level = 0,
    onFolderPress,
}: {
    asset: DeploymentAsset
    level?: number
    onFolderPress: (path: string) => void
}) {
    const handlePress = useCallback(() => {
        if (!asset.children) return
        onFolderPress(asset.path)
    }, [asset, onFolderPress])

    return (
        <View style={{ paddingRight: 2 }}>
            <TouchableOpacity
                onPress={handlePress}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 4,
                    paddingLeft: level * INDENT_SIZE,
                    gap: 8,
                }}
            >
                <Ionicons
                    name={
                        asset.children
                            ? asset.isExpanded
                                ? 'folder-open-outline'
                                : 'folder-outline'
                            : 'document-outline'
                    }
                    size={20}
                    color={COLORS.textMuted}
                />

                <Text
                    style={{
                        color: COLORS.text,
                        fontSize: 14,
                    }}
                >
                    {asset.path.split('/').pop()}
                </Text>
            </TouchableOpacity>

            {asset.children && asset.isExpanded && (
                <View>
                    {asset.children.map((item) => (
                        <FileTreeAsset
                            key={item.path}
                            asset={item}
                            level={level + 1}
                            onFolderPress={onFolderPress}
                        />
                    ))}
                </View>
            )}
        </View>
    )
}
