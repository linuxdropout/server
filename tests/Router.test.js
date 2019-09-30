const tape = require('tape')
const { setRouteHandler, getRouteHandlers } = require('../dist/Router')

tape('setRouteHandler :: sets single route', t => {
    const routing = {
        handlers: [],
        routes: new Map()
    }

    const testHandler = () => { }
    setRouteHandler(
        routing,
        'GET',
        ['hello', 'world'],
        testHandler
    )

    t.deepEqual(routing.handlers, [], 'correct handlers')
    t.equal(routing.routes.size, 1, 'correct routes')

    const helloRoute = routing.routes.get('hello')
    t.deepEqual(helloRoute.handlers, [], 'correct handlers')
    t.equal(helloRoute.routes.size, 1, 'correct routes')

    const worldRoute = helloRoute.routes.get('world')
    t.deepEqual(worldRoute.handlers, [{
        method: 'GET',
        handler: testHandler,
        order: 0
    }], 'correct handlers')
    t.equal(worldRoute.routes.size, 0, 'correct routes')

    t.end()
})

tape('setRouteHandler :: sets multiple routes', t => {
    const routing = {
        handlers: [],
        routes: new Map()
    }

    const testHandler = () => { }
    setRouteHandler(
        routing,
        'GET',
        ['hello', 'world'],
        testHandler
    )
    setRouteHandler(
        routing,
        'POST',
        ['hello', ':name'],
        testHandler,
        1
    )

    t.deepEqual(routing.handlers, [], 'correct handlers')
    t.equal(routing.routes.size, 1, 'correct routes')

    const helloRoute = routing.routes.get('hello')
    t.deepEqual(helloRoute.handlers, [], 'correct handlers')
    t.equal(helloRoute.routes.size, 2, 'correct routes')

    const worldRoute = helloRoute.routes.get('world')
    t.deepEqual(worldRoute.handlers, [{
        method: 'GET',
        order: 0,
        handler: testHandler
    }], 'correct handlers')
    t.equal(worldRoute.routes.size, 0, 'correct routes')

    const nameRoute = helloRoute.routes.get(':name')
    t.deepEqual(nameRoute.handlers, [{
        method: 'POST',
        order: 1,
        handler: testHandler
    }], 'correct handlers')
    t.equal(nameRoute.routes.size, 0, 'correct routes')

    t.end()
})

tape('getRouteHandlers', t => {
    const routing = {
        handlers: [],
        routes: new Map()
    }

    const firstHandler = () => { }
    const secondHandler = () => { }
    const lastHandler = () => { }
    setRouteHandler(
        routing,
        'all',
        [],
        firstHandler
    )
    setRouteHandler(
        routing,
        'all',
        [],
        lastHandler,
        2
    )
    setRouteHandler(
        routing,
        'GET',
        ['john'],
        () => { }
    )
    setRouteHandler(
        routing,
        'GET',
        ['hello', ':name'],
        secondHandler,
        1
    )

    const handlers = getRouteHandlers(
        routing,
        ['hello', 'John Doe'],
        ['all', 'GET']
    )

    t.deepEqual(
        handlers,
        [
            { method: 'all', path: '', order: 0, handler: firstHandler, params: {} },
            { method: 'GET', path: 'hello/John Doe', order: 1, handler: secondHandler, params: { name: 'John Doe' } },
            { method: 'all', path: '', order: 2, handler: lastHandler, params: {} },
        ]
    )

    t.end()
})