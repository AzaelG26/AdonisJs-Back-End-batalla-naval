import vine from '@vinejs/vine'

export const storeMoveValidator = vine.compile(
  vine.object({
    x: vine.number().range(0, 7),
    y: vine.number().range(0, 7),
  })
)
