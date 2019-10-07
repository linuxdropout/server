const supertest = require('supertest')
const { createServer, createRouter } = require('../dist')
const tape = require('tape')
const bodyParser = require('body-parser')
const session = require('express-session')

tape('server :: e2e handlers including router', async t => {
    t.plan(6)

    const server = createServer()
    server.listen(8080)
    tape.onFinish(() => {
        server.close()
    })

    server
        .use(
            (req, res, next) => {
                res.setHeader('Access-Control-Allow-Origin', '*')
                return next()
            },
            (req, res, next) => {
                if (req.method === 'OPTIONS') return res.status(200).end()
                return next()
            },
            bodyParser.urlencoded(),
            bodyParser.json(),
            session({
                secret: 'test',
                cookie: { secure: false },
                resave: false,
                saveUninitialized: false
            })
        )

    const router = createRouter()
    router.use((req, res, next) => {
        req.routerData = {}
        return next()
    })
    router.route('/test1', 'GET', (req, res, next) => {
        req.routerData.visited = '/test1'
        return next()
    })
    router.route('/test1/:param', 'GET', (req, res, next) => {
        const { routerData, params } = req
        return res.json({ routerData, params }).end()
    })
    router.route('/test2', 'POST', (req, res, next) => {
        const { body, session } = req
        session.data = body
        return res.status(201).end()
    })
    router.route('/test3', 'PUT', (req, res, next) => {

        res.setHeader('Content-Type', 'application/json')
            .status(202, 'SESSION DATA')
            .send('[')
            .send(req.session)

        return next()
    })
    router.route('/test3/:param', 'PUT', (req, res, next) => {
        res.send(',')
            .send(req.params)
            .send(']')

        return next()
    })

    function hasSessionCookie(res) {
        const valid = /connect\.sid=[^;]*;\sPath=\/;\sHttpOnly/.test(res.header['set-cookie'])
        t.ok(valid, 'has session cookie')
        return valid
    }

    server.use('/router', router)
    supertest(server)
        .get('/router/test1/hello')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((error, response) => {
            t.error(error, 'no error /router/test1/hello')
            t.deepEqual(
                response.body,
                {
                    params: {
                        param: 'hello'
                    },
                    routerData: {
                        visited: '/test1'
                    }
                },
                '/router/test1/hello has expected response'
            )
        })

    const Cookie = await new Promise(resolve => {
        supertest(server)
            .post('/router/test2')
            .send({ foo: 'bar' })
            .expect(201)
            .expect(hasSessionCookie)
            .end((error, response) => {
                t.error(error, 'no error /router/test2')
                return resolve(
                    response.header['set-cookie'].shift()
                )
            })
    })

    supertest(server)
        .put('/router/test3/hello')
        .set('Cookie', Cookie)
        .expect(202)
        .expect('Content-Type', /json/)
        .end((error, response) => {
            t.error(error, 'no error /router/test3/hello')
            t.deepEqual(
                response.body,
                [
                    {
                        cookie: {
                            originalMaxAge: null,
                            expires: null,
                            secure: false,
                            httpOnly: true,
                            path: '/'
                        },
                        data: { foo: 'bar' }
                    },
                    { param: 'hello' }
                ],
                '/router/test3/hello has expected response'
            )
        })
})
