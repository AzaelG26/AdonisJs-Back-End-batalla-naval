import { AccessToken } from '@adonisjs/auth/access_tokens'
import User from '#models/user'
interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export default class AuthService {
  async login(email: string, password: string): Promise<AccessToken> {
    const user = await User.verifyCredentials(email, password)
    return await User.accessTokens.create(user)
  }

  async logout(auth: any): Promise<void> {
    const token = auth.use('api').token

    if (token) {
      await auth.user!.related('accessTokens').query().where('id', token.identifier).delete()
    }
  }
  async register(payload: RegisterPayload): Promise<AccessToken> {
    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    })
    return await User.accessTokens.create(user)
  }
}
