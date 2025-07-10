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
import { middleware } from '#start/kernel'
import GamesController from '../app/crud/controllers/games_controller.js'
import MovesController from '../app/crud/controllers/moves_controller.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/login', [AuthController, 'login'])
router.post('/register', [AuthController, 'register'])
router.post('logout', [AuthController, 'logout'])

router
  .group(() => {
    router.get('/games', [GamesController, 'index'])
    router.post('/games', [GamesController, 'store'])
    router.get('/games/:id', [GamesController, 'show'])
    router.put('/games/:id', [GamesController, 'update'])
    router.post('/games/:id/leave', [GamesController, 'leave'])
    router.put('/games/:id/cancel', [GamesController, 'cancel'])
    router.get('/api/games-played', [GamesController, 'dataOnGamesPlayed'])
    router.get('/api/games-played/results', [GamesController, 'gamesByResult'])
    router.get('/games/:gameId/moves', [MovesController, 'index'])
    router.post('/games/:gameId/moves', [MovesController, 'store'])
    router.get('/auth/validate', async ({ auth }) => {
      const user = await auth.use('api').authenticate()
      return { valid: true, user }
    })
  })
  .use(middleware.auth())
