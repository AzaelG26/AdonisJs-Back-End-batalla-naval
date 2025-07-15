import vine from '@vinejs/vine'

export const storeMoveValidator = vine.compile(
  vine.object({
    x: vine.number().min(0).max(7),
    y: vine.number().min(0).max(7),
  })
)
