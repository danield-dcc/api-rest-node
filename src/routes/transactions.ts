import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

// cookies -> formas ds manter contexto entre requisições

const createTransactionBodySchema = z.object({
  title: z.string(),
  amount: z.number(),
  type: z.enum(['credit', 'debit']),
})

const getTransactionParamsSchema = z.object({
  id: z.string().uuid(),
})

// OBRIGATORIAMENTE o plugin deve ser um função async/await
export async function transactionsRoutes(app: FastifyInstance) {
  // um hook global onde todas as rotas o utilizam
  // um handler global
  app.addHook('preHandler', async (request) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  // reply === response
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists], // preHandler chama o middleware
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('*')

      return { transactions }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists], // preHandler chama o middleware
    },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists], // preHandler chama o middleware
    },
    async (request) => {
      const { id } = getTransactionParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      return { transaction }
    },
  )

  app.post('/', async (request, reply) => {
    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body,
    )

    // cookie
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/', // qualquer rota pode acessar o cookie
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days  em milissegundos => um segundo(1000) * um minuto(60) * um hora(60) * um dia(24) * 7dias(7)
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })
    // se quisermos mostrar o retorno, adicionar depois do parenteses .returning('*')

    // code 201
    return reply.status(201).send()
  })
}
