const supertest = require('supertest')
const { createServer, createRouter } = require('../dist')
const tape = require('tape')

tape('e2e', t => {
    const server = createServer()
    server.listen(8080)

    server.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        req.locals = {
            hello: 'world'
        }
        return next()
    })

    const router = createRouter()
    router.route('/test1', 'GET', (req, res) => {
        return res.json(req.locals).end()
    })

    server.use('/test', router)

    supertest(server)
        .get('/test/test1')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
            t.error(err)
            t.deepEqual(res.body, { hello: 'world' })
            server.close()
            t.end()
        })
})
