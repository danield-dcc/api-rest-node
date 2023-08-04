import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { transactionsRoutes } from './routes/transactions'

export const app = fastify()

// trabalhando com cookies
app.register(cookie)

// prefix indica que as rotas começam com o nome /transactions
app.register(transactionsRoutes, {
  prefix: 'transactions',
})
