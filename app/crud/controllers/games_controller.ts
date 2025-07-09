import { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import Board from '#models/board'
import User from '#models/user'

export default class GamesController {
  public async index({ auth, response }: HttpContext): Promise<void> {
    const user = await auth.use('api').authenticate()
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
    const user = await auth.use('api').authenticate()
    //console.log('👉 user en controller:', user)
    if (!user) {
      return response.unauthorized({ message: 'Usuario no autenticado.' })
    }
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
    return response.created({ game })
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
    const user = await auth.use('api').authenticate()
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
    const user = await auth.use('api').authenticate()
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
    const user = await auth.use('api').authenticate()
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
  public async dataOnGamesPlayed({ auth, request, response }: HttpContext) {
    const user = await auth.use('api').authenticate()
    const withWinner = request.qs().with_winner !== 'false'
    const query = Game.query().where((q) => {
        q.where('playerOneId', user.id).orWhere('playerTwoId', user.id)
      })
      .where('status', 'finished')
      .where('isActive', true)
    if (withWinner) {
      query.whereNotNull('winnerId')
    } else {
      query.whereNull('winnerId')
    }
    const games = await query
    const wins = games.filter((g) => g.winnerId === user.id).length
    const losses = games.filter((g) => g.winnerId && g.winnerId !== user.id).length
    return response.ok({ wins, losses })
  }
  public async gamesByResult({ auth, request, response }: HttpContext) {
    const user = await auth.use('api').authenticate()
    const type = request.qs().type
    const query = Game.query()
      .where((q) => {
        q.where('playerOneId', user.id).orWhere('playerTwoId', user.id)
      })
      .where('status', 'finished')
      .where('isActive', true)
      .whereNotNull('winnerId')
    if (type === 'won') {
      query.where('winnerId', user.id)
    } else if (type === 'lost') {
      query.whereNot('winnerId', user.id)
    } else {
      return response.badRequest({ error: 'Tipo inválido. Usa "won" o "lost".' })
    }
    const games = await query
    const results = await Promise.all(games.map(async (game) => {
        const isPlayerOne = game.playerOneId === user.id
        const opponentId = isPlayerOne ? game.playerTwoId : game.playerOneId
        const opponent = opponentId ? await User.find(opponentId) : null
        return {
          id: game.id,
          me: user.fullName || user.email,
          opponent: opponent?.fullName || opponent?.email || 'Desconocido',
        }
      })
    )
    return response.ok({ results })
  }
}
