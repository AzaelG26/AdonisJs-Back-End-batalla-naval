import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    //console.log('🔐 Entró al middleware')
    try {
      await ctx.auth.use('api').authenticate()
      //console.log('👤 Usuario autenticado:', ctx.auth.use('api').user)
      await next()
    } catch (error) {
      console.log('❌ Auth failed:', error.message)
      return ctx.response.status(401).send({
        message: 'Unauthorized. Invalid or expired token.',
        error: error.message,
      })
    }
  }
}
