import { COLORS } from '@/theme/colors'
import { ActivityIndicator as RNActivityIndicator } from 'react-native'

export default function ActivityIndicator({
    size = 'large',
}: {
    size?: 'small' | 'large'
}) {
    return <RNActivityIndicator size={size} color={COLORS.teal500} style={{ flex: 1 }} />
}
