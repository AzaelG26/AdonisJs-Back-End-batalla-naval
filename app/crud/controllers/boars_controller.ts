import { HttpContext } from '@adonisjs/core/http'
import Board from '#models/board'
import Game from '#models/game'

export default class BoarsController {
  public async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const boards = await Board.query().where('user_id', user.id)
    return response.ok(boards)
  }

  // Mostrar el tablero del usuario para un juego específico
  public async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const game = await Game.findOrFail(params.gameId)

    const board = await Board.query()
      .where('game_id', game.id)
      .where('user_id', user.id)
      .firstOrFail()

    return response.ok({
      grid: board.grid,
    })
  }
}
