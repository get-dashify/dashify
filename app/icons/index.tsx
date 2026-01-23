import Text from '@/components/base/Text'
import { COLORS } from '@/theme/colors'
import { Ionicons } from '@expo/vector-icons'
import {
    getAppIconName,
    setAlternateAppIcon,
    supportsAlternateIcons,
} from 'expo-alternate-app-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native'

const ICONS = [
    {
        id: null,
        label: 'Default',
        image: require('@/assets/icon.png'),
    },
    {
        id: 'NodesDark',
        label: 'Nodes (Dark)',
        image: require('@/assets/icon-nodes-dark.png'),
    },
    {
        id: 'SymbolDark',
        label: 'Symbol (Dark)',
        image: require('@/assets/icon-symbol-dark.png'),
    },
    {
        id: 'SymbolLight',
        label: 'Symbol (Light)',
        image: require('@/assets/icon-symbol-light.png'),
    },
    {
        id: 'SymbolNodesDark',
        label: 'Symbol Nodes (Dark)',
        image: require('@/assets/icon-symbol-nodes-dark.png'),
    },
    {
        id: 'SymbolNodesLight',
        label: 'Symbol Nodes (Light)',
        image: require('@/assets/icon-symbol-nodes-light.png'),
    },
] as const

export default function IconsScreen() {
    const [currentIcon, setCurrentIcon] = useState<string | null>(null)

    useEffect(() => {
        setCurrentIcon(getAppIconName())
    }, [])

    const handleIconSelect = async (iconName: string | null) => {
        if (!supportsAlternateIcons) {
            Alert.alert('Not Supported', 'Alternate icons are not supported on this device.')
            return
        }

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            await setAlternateAppIcon(iconName)
            setCurrentIcon(iconName)
        } catch {
            Alert.alert('Error', 'Failed to change app icon.')
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: COLORS.bgApp }}
            contentInsetAdjustmentBehavior="automatic"
        >
            <View style={{ marginTop: 16 }}>
                {ICONS.map((icon, index) => {
                    const isSelected = currentIcon === icon.id
                    const isFirst = index === 0
                    return (
                        <TouchableOpacity
                            key={icon.id}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: COLORS.bgDark,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderTopWidth: isFirst ? 1 : 0,
                                borderBottomWidth: 1,
                                borderColor: COLORS.hr,
                            }}
                            onPress={() => handleIconSelect(icon.id)}
                        >
                            <Image
                                source={icon.image}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 13,
                                }}
                            />
                            <Text
                                style={{
                                    flex: 1,
                                    marginLeft: 16,
                                    fontSize: 17,
                                    color: COLORS.text,
                                }}
                            >
                                {icon.label}
                            </Text>
                            {isSelected && (
                                <Ionicons name="checkmark" size={24} color={COLORS.teal500} />
                            )}
                        </TouchableOpacity>
                    )
                })}
            </View>
        </ScrollView>
    )
}
