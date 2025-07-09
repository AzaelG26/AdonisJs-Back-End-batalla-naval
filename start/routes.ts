/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AuthController from '../app/crud/controllers/auth_controller.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/login', [AuthController, 'login'])
router.post('/register', [AuthController, 'register'])
router.post('logout', [AuthController, 'logout'])
router.get('/auth/validate', async ({ auth }) => {
  await auth.use('api').authenticate()
  return { valid: true, user: auth.user }
})
