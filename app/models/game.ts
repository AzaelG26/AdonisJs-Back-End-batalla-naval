import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Board from '#models/board'
import Move from '#models/move'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  status?: 'waiting' | 'playing' | 'finished'

  @column()
  playerOneId?: number

  @column()
  playerTwoId?: number | null

  @column()
  currentTurn?: number | null

  @column()
  winnerId?: number | null

  @column()
  isActive?: boolean
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime


  @belongsTo(() => User, { foreignKey: 'playerOneId' })
  playerOne?: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'playerTwoId' })
  playerTwo?: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'currentTurn' })
  currentPlayer?: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'winnerId' })
  winner?: BelongsTo<typeof User>

  @hasMany(() => Board)
  declare boards: HasMany<typeof Board>

  @hasMany(() => Move)
  declare moves: HasMany<typeof Move>
}
