import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Game from '#models/game'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Board extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  gameId?: number

  @column()
  userId?: number

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
  })
  public grid: string[] | undefined

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Game)
  game?: BelongsTo<typeof Game>

  @belongsTo(() => User)
  user?: BelongsTo<typeof User>
}
