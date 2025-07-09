import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('status', ['waiting', 'playing', 'finished']).notNullable().defaultTo('waiting')
      table.integer('player_one_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('player_two_id').unsigned().nullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('current_turn').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.integer('winner_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
