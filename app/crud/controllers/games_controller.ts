// import type { HttpContext } from '@adonisjs/core/http'
import { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import Board from '#models/board'
import Move from '#models/move'
import { inject } from '@adonisjs/core'

@inject()
export default class GamesController {
  public async index({ auth, response }: HttpContext): Promise<void> {
    const user = auth.user!

    const games = await Game.query()
      .where('is_active', true)
      .andWhere((query) => {
        query.where('status', 'waiting').orWhere((sub) => {
          sub.whereIn('status', ['waiting', 'playing']).andWhere((q2) => {
            q2.where('player_one_id', user.id).orWhere('player_two_id', user.id)
          })
        })
      })
      .preload('boards', (b) => b.preload('user'))
    return response.ok({ games })
  }

  public async store({ auth, response }: HttpContext) {
    const user = auth.user!

    const game = await Game.create({
      playerOneId: user.id,
      status: 'waiting',
      currentTurn: user.id,
    })

    const ships = this.generateRandomShips()

    await Board.create({
      gameId: game.id,
      userId: user.id,
      grid: ships,
    })

    await game.load((loader) => {
      loader.preload('boards', (b) => b.preload('user')).preload('moves')
    })

    return response.created(game)
  }

  private generateRandomShips(): string[] {
    const ships: string[] = []
    const positions = new Set<string>()

    while (ships.length < 15) {
      const row = String.fromCharCode(65 + Math.floor(Math.random() * 8))
      const col = Math.floor(Math.random() * 8) + 1
      const pos = `${row}${col}`

      if (!positions.has(pos)) {
        positions.add(pos)
        ships.push(pos)
      }
    }

    return ships
  }

  public async show({ params, response }: HttpContext) {
    const game = await Game.findOrFail(params.id)
    await game.load((loader) => {
      loader.preload('boards', (b) => b.preload('user')).preload('moves')
    })

    return response.ok({ game })
  }

  public async update({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const game = await Game.findOrFail(params.id)
    await game.load('boards')

    if (game.playerOneId === user.id) {
      return response.badRequest({ error: 'No puedes unirte a tu propio juego.' })
    }

    if (game.playerTwoId || game.boards.length >= 2) {
      return response.badRequest({ error: 'Este juego ya está lleno.' })
    }

    game.merge({ playerTwoId: user.id, status: 'playing' })
    await game.save()

    const ships = this.generateRandomShips()

    await Board.create({
      gameId: game.id,
      userId: user.id,
      grid: ships,
    })

    await game.load((loader) => {
      loader.preload('boards', (b) => b.preload('user')).preload('moves')
    })

    return response.ok(game)
  }

  public async leave({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const game = await Game.findOrFail(params.id)

    if (user.id !== game.playerOneId && user.id !== game.playerTwoId) {
      return response.unauthorized({ message: 'No participas en esta partida.' })
    }

    if (game.status !== 'playing') {
      return response.badRequest({ message: 'El juego no está en curso.' })
    }

    const opponentId = user.id === game.playerOneId ? game.playerTwoId : game.playerOneId

    game.merge({
      status: 'finished',
      winnerId: opponentId,
      currentTurn: null,
    })
    await game.save()

    return response.ok({ message: 'La partida ha finalizado.' })
  }

  public async cancel({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const game = await Game.findOrFail(params.id)
    await game.load('boards')

    if (game.boards[0].userId !== user.id) {
      return response.unauthorized({ message: 'No eres el creador del juego.' })
    }

    if (game.playerTwoId) {
      game.merge({ winnerId: game.playerTwoId, status: 'finished', isActive: false })
    } else {
      game.merge({ status: 'finished', isActive: false })
    }

    await game.save()

    return response.ok({ message: 'El juego ha sido cancelado.' })
  }
}
