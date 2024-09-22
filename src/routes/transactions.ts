import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import crypto from 'node:crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function transactionsRoutes(app: FastifyInstance) {

    app.get('/', {
        preHandler: [checkSessionIdExists],
    }, async (request, reply) => {

        const { sessionId } = request.cookies

        const transactions = await knex('transactions')
            .where({
                session_id: sessionId,
            })
            .select()

        return reply.status(200).send({
            transactions
        });
    });

    app.get('/:id', {
        preHandler: [checkSessionIdExists],
    }, async (request, reply) => {
        const getTransactionByIdParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { sessionId } = request.cookies

        const { id } = getTransactionByIdParamsSchema.parse(request.params)

        const transactions = await knex('transactions')
            .where({
                session_id: sessionId,
                id,
            })
            .first()

        return reply.status(200).send({
            transactions
        });
    });

    app.get('/summary', {
        preHandler: [checkSessionIdExists],
    }, async (request) => {

        const { sessionId } = request.cookies

        const summary = await knex('transactions')
            .sum('amount', { as: 'total' })
            .where('session_id', sessionId)
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

        const [transaction] = await knex('transactions')
            .insert({
                id: crypto.randomUUID(),
                title,
                amount: type === 'credit' ? amount : amount * -1,
                session_id: sessionId,
            })
            .returning(['id', 'title', 'amount', 'created_at', 'session_id']); // Retorna o registro inserido

        return reply.status(201).send({
            transactions: transaction, // Retorna o objeto recém-criado
        });
    });
}
