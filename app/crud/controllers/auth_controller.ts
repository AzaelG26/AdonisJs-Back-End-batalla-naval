import { HttpContext } from '@adonisjs/core/http'
import { loginValidator, registerValidator } from '../validators/auth_validator.js'
import AuthService from '../services/authService.js'

export default class AuthController {
  private authService = new AuthService()

  async login({ request, response }: HttpContext): Promise<void> {
    const { email, password } = await request.validateUsing(loginValidator)
    const token = await this.authService.login(email, password)
    return response.ok({ message: 'Login successful', token: token.value?.release() })
  }

  async logout({ auth, response }: HttpContext): Promise<void> {
    await this.authService.logout(auth)
    return response.ok({ message: 'Logout successful' })
  }

  async register({ request, response }: HttpContext): Promise<void> {
    const payload = await request.validateUsing(registerValidator)
    const token = await this.authService.register(payload)

    return response.created({
      message: 'Register successful',
      token: token.value?.release(),
    })
  }
}
