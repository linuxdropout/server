const supertest = require('supertest')
const tape = require('tape')
const bodyParser = require('body-parser')
const sessionMiddleware = require('express-session')
const { createServer, createRouter } = require('../dist')

tape('server :: e2e handlers including router', async t => {
    t.plan(9)

    const server = createServer()
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
            bodyParser.urlencoded({ extended: true }),
            bodyParser.json(),
            sessionMiddleware({
                secret: 'test',
                cookie: { secure: false },
                resave: false,
                saveUninitialized: false,
            }),
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
    router.get('/test12', (req, res) => {
        const { routerData, params } = req
        return res.json({ routerData, params }).end()
    })
    router.route('/test1/:param', 'GET', (req, res) => {
        const { routerData, params } = req
        return res.json({ routerData, params }).end()
    })
    router.route('/test2', 'POST', (req, res) => {
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
        .get('/router/test1/hello?a=b')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((error, response) => {
            t.error(error, 'no error /router/test1/hello')
            t.deepEqual(
                response.body,
                {
                    params: {
                        param: 'hello',
                    },
                    routerData: {
                        visited: '/test1',
                    },
                },
                '/router/test1/hello has expected response',
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
                    response.header['set-cookie'].shift(),
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
            t.equal(response.res.statusMessage, 'SESSION DATA', 'statusMessage carried and custom')
            t.deepEqual(
                response.body,
                [
                    {
                        cookie: {
                            originalMaxAge: null,
                            expires: null,
                            secure: false,
                            httpOnly: true,
                            path: '/',
                        },
                        data: { foo: 'bar' },
                    },
                    { param: 'hello' },
                ],
                '/router/test3/hello has expected response',
            )
        })

    supertest(server)
        .get('/router/test12?abc=123')
        .set('Cookie', Cookie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((error, response) => {
            t.error(error, 'get /router/test12?abc=123')
            t.deepEqual(
                response.body,
                { routerData: {}, params: {} },
                'has expected response',
            )
        })
})
