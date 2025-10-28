import type { paths } from '@/lib/netlify/schema'
import createClient from 'openapi-fetch'

export async function checkLoginCredentials(token: string) {
    try {
        const netlify = createClient<paths>({
            baseUrl: 'https://app.netlify.com/access-control/bb-api/api/v1',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const response = await netlify.GET('/user')

        if (response.error) {
            throw new Error(response.error.message)
        }

        return response.data
    } catch (e) {
        const error = e as Error
        console.log('Error checking login credentials', error)
        throw error
    }
}
