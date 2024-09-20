import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import crypto from 'node:crypto';

export async function transactionsRoutes(app: FastifyInstance) {  

  app.get('/', async (request, reply) => {
    const transactions = await knex('transactions').select()

    return reply.status(200).send({ 
        transactions 
    });
  });

  app.get('/:id', async (request, reply) => {
    const getTransactionByIdParamsSchema = z.object({
        id: z.string().uuid(),
    })

    const { id } = getTransactionByIdParamsSchema.parse(request.params)

    const transactions = await knex('transactions').where('id', id).first()

    return reply.status(200).send({ 
        transactions 
    });
  });

  app.get('/summary', async () => {
    const summary = await knex('transactions')
      .sum('amount', { as: 'total' })
      .first()

    return { summary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
        title: z.string(),
        amount: z.number(),
        type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
        request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = crypto.randomUUID()
      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, //7 days
      })
    }  

    await knex('transactions')
      .insert({
        id: crypto.randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
      })

    return reply.status(201).send();
  });
}
