import vine from '@vinejs/vine'

const loginValidator = vine.compile(
  vine.object({
    email: vine.string(),
    password: vine.string(),
  })
)

const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string(),
    email: vine.string(),
    password: vine.string(),
  })
)
export { loginValidator, registerValidator }
