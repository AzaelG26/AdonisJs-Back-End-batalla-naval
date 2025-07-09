// import type { HttpContext } from '@adonisjs/core/http'
import { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import Move from '#models/move'
import Board from '#models/board'
import { storeMoveValidator } from '../validators/store_move.js'
import User from '#models/user'

export default class MovesController {
  public async index({ params, response }: HttpContext) {
    const game = await Game.findOrFail(params.gameId)

    await game.load('moves', (query) => {
      query.preload('user')
    })

    return response.ok({ moves: game.moves })
  }

  public async store({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const game = await Game.findOrFail(params.gameId)

    // 1) Validar estado
    if (game.status !== 'playing') {
      return response.badRequest({ error: 'El juego no está en curso.' })
    }

    // 2) Validar turno
    if (game.currentTurn !== user.id) {
      return response.badRequest({ error: 'No es tu turno.' })
    }

    // 3) Validar coordenadas con Vine
    const { x, y } = await request.validateUsing(storeMoveValidator)

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const pos = `${letters[x]}${y + 1}`

    // 4) Disparo duplicado
    const alreadyShot = await Move.query()
      .where('game_id', game.id)
      .where('user_id', user.id)
      .where('x', x)
      .where('y', y)
      .first()

    if (alreadyShot) {
      return response.badRequest({ error: 'Ya atacaste esa casilla.' })
    }

    // 5) Tablero del oponente
    const opponentId = user.id === game.playerOneId ? game.playerTwoId : game.playerOneId

    if (!opponentId) {
      return response.badRequest({ error: 'No hay oponente aún.' })
    }

    const board = await Board.query()
      .where('game_id', game.id)
      .where('user_id', opponentId)
      .firstOrFail()

    const grid: string[] = board.grid
    const hit = grid.includes(pos)

    // 6) Registrar movimiento
    await Move.create({
      gameId: game.id,
      userId: user.id,
      x,
      y,
      result: hit ? 'hit' : 'miss',
    })

    // 7) Verificar victoria
    if (hit) {
      const hits = await Move.query()
        .where('game_id', game.id)
        .where('user_id', user.id)
        .where('result', 'hit')

      const hitPositions = hits
        .filter((move) => move.x !== undefined && move.y !== undefined)
        .map((move) => `${letters[move.x!]}${move.y! + 1}`)
      const remaining = grid.filter((p) => !hitPositions.includes(p))

      if (remaining.length === 0) {
        game.merge({
          status: 'finished',
          winnerId: user.id,
          currentTurn: null,
        })
        await game.save()

        return response.ok({
          message: '¡Has ganado la partida!',
          result: 'hit',
          winner: true,
        })
      }
    }

    // 8) Cambiar turno
    const nextTurn = user.id === game.playerOneId ? game.playerTwoId : game.playerOneId
    game.merge({ currentTurn: nextTurn })
    await game.save()

    return response.ok({
      message: 'Movimiento registrado correctamente.',
      result: hit ? 'hit' : 'miss',
      winner: false,
    })
  }
}
