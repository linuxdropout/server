const { getRouteHandlers, setRouteHandler, parsePath } = require('../dist/Router')
const tape = require('tape')

function hasSubroutes(t, routing, subRoutes) {
    t.equal(routing.routes.size, subRoutes.length, `route has ${subRoutes.length} subroutes`)
    for (const route of subRoutes) {
        t.ok(routing.routes.has(route), `route has ${route} subRoute`)
    }
}

function hasHandlers(t, routing, handlers) {
    t.equal(routing.handlers.length, handlers.length, `route has ${handlers.length} handlers`)
    t.deepEqual(routing.handlers, handlers, `handlers are as expected`)
}

tape('parsePath :: correctly parses routes', t => {
    const paths = [
        '/test/test/',
        'test/test/',
        '/test/test',
        'test/test'
    ]
    for (const path of paths) {
        t.deepEqual(parsePath(path), ['test', 'test'], `${path} => ['test', 'test']`)
    }
    t.end()
})

tape('setRouteHandlers :: single route', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    setRouteHandler(routing, ['hello'], 'GET', testHandlerHello)

    hasSubroutes(t, routing, ['hello'])
    hasHandlers(t, routing, [])

    const helloRoute = routing.routes.get('hello')
    hasSubroutes(t, helloRoute, [])
    hasHandlers(t, helloRoute, [['GET', testHandlerHello]])

    t.end()
})

tape('setRouteHandlers :: route and subroute', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerWorld = () => { }
    setRouteHandler(routing, ['hello', 'world'], 'GET', testHandlerWorld)

    hasSubroutes(t, routing, ['hello'])
    hasHandlers(t, routing, [])

    const helloRoute = routing.routes.get('hello')
    hasSubroutes(t, helloRoute, ['world'])
    hasHandlers(t, routing, [])

    const worldRoute = helloRoute.routes.get('world')
    hasSubroutes(t, worldRoute, [])
    hasHandlers(t, worldRoute, [['GET', testHandlerWorld]])

    t.end()
})

tape('setRouteHandlers :: multiple routes', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    const testHandlerWorld = () => { }
    setRouteHandler(routing, ['hello'], 'GET', testHandlerHello)
    setRouteHandler(routing, ['world'], 'POST', testHandlerWorld)

    hasSubroutes(t, routing, ['hello', 'world'])
    hasHandlers(t, routing, [])

    const helloRoute = routing.routes.get('hello')
    hasSubroutes(t, helloRoute, [])
    hasHandlers(t, helloRoute, [['GET', testHandlerHello]])

    const worldRoute = routing.routes.get('world')
    hasSubroutes(t, worldRoute, [])
    hasHandlers(t, worldRoute, [['POST', testHandlerWorld]])

    t.end()
})

tape('setRouteHandlers :: multiple routes with params and subroutes', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerWorld = () => { }
    const testHandlerName = () => { }
    setRouteHandler(routing, ['hello', 'world'], 'GET', testHandlerWorld)
    setRouteHandler(routing, ['hello', ':name'], 'POST', testHandlerName)

    hasSubroutes(t, routing, ['hello'])
    hasHandlers(t, routing, [])

    const helloRoute = routing.routes.get('hello')
    hasSubroutes(t, helloRoute, ['world', ':name'])
    hasHandlers(t, helloRoute, [])

    const worldRoute = helloRoute.routes.get('world')
    hasSubroutes(t, worldRoute, [])
    hasHandlers(t, worldRoute, [['GET', testHandlerWorld]])

    const nameRoute = helloRoute.routes.get(':name')
    hasSubroutes(t, nameRoute, [])
    hasHandlers(t, nameRoute, [['POST', testHandlerName]])

    t.end()
})

tape('getRouteHandlers :: single route', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    setRouteHandler(routing, ['hello'], 'GET', testHandlerHello)

    const handlers = getRouteHandlers(
        routing,
        ['hello'],
        ['GET']
    )
    t.deepEqual(
        handlers,
        [
            [testHandlerHello, {}]
        ],
        'returns correct handler'
    )

    t.end()
})
tape('getRouteHandlers :: only matches specified route', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    setRouteHandler(routing, ['hello'], 'GET', testHandlerHello)

    const handlers = getRouteHandlers(
        routing,
        [':hello'],
        ['GET']
    )
    t.deepEqual(
        handlers,
        [],
        'returns no handler'
    )

    t.end()
})
tape('getRouteHandlers :: nested route', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    setRouteHandler(routing, ['hello', 'world'], 'GET', testHandlerHello)

    const handlers = getRouteHandlers(
        routing,
        ['hello', 'world'],
        ['GET']
    )
    t.deepEqual(
        handlers,
        [
            [testHandlerHello, {}]
        ],
        'returns correct handler'
    )

    t.end()
})
tape('getRouteHandlers :: route with params', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    setRouteHandler(routing, ['hello', ':name'], 'GET', testHandlerHello)

    const handlers = getRouteHandlers(
        routing,
        ['hello', 'John Doe'],
        ['GET']
    )
    t.deepEqual(
        handlers,
        [
            [testHandlerHello, { name: 'John Doe' }]
        ],
        'returns correct handler'
    )

    t.end()
})
tape('getRouteHandlers :: multiple routes', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    const testHandlerWorld = () => { }
    setRouteHandler(routing, ['hello', ':name'], 'GET', testHandlerHello)
    setRouteHandler(routing, ['world', ':name'], 'POST', testHandlerWorld)

    const handlers1 = getRouteHandlers(
        routing,
        ['hello', ':name'],
        ['GET']
    )
    t.deepEqual(
        handlers1,
        [
            [testHandlerHello, { name: ':name' }]
        ],
        'returns correct handler'
    )

    const handlers2 = getRouteHandlers(
        routing,
        ['world', ':name'],
        ['POST']
    )
    t.deepEqual(
        handlers2,
        [
            [testHandlerWorld, { name: ':name' }]
        ],
        'returns correct handler'
    )

    t.end()
})

tape('getRouteHandlers :: nested params', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const testHandlerHello = () => { }
    const testHandlerWorld = () => { }
    setRouteHandler(routing, ['hello', ':name', ':test', ':-&^&£%*$test2'], 'GET', testHandlerHello)
    setRouteHandler(routing, ['world', ':name'], 'POST', testHandlerWorld)

    const handlers1 = getRouteHandlers(
        routing,
        ['hello', ':name', 'John Doe', 'tester'],
        ['GET']
    )
    t.deepEqual(
        handlers1,
        [
            [testHandlerHello, { name: ':name', test: 'John Doe', '-&^&£%*$test2': 'tester' }]
        ],
        'returns correct handler'
    )

    const handlers2 = getRouteHandlers(
        routing,
        ['world', ':name'],
        ['POST']
    )
    t.deepEqual(
        handlers2,
        [
            [testHandlerWorld, { name: ':name' }]
        ],
        'returns correct handler'
    )

    t.end()
})

tape('getRouteHandlers :: nested params', t => {
    const routing = {
        routes: new Map(),
        handlers: []
    }

    const before = () => { }
    const firstRoute = () => { }
    const secondRoute = () => { }
    const after = () => { }
    setRouteHandler(routing, [], 'all', before)
    setRouteHandler(routing, ['test'], 'GET', firstRoute)
    setRouteHandler(routing, ['test', ':arg'], 'GET', secondRoute)
    setRouteHandler(routing, [], 'all', after)

    const handlers = getRouteHandlers(routing, ['test', 'value'], ['all', 'GET'])
    t.deepEqual(
        handlers,
        [
            [before, {}],
            [after, {}],
            [firstRoute, {}],
            [secondRoute, { arg: 'value' }]
        ],
        'Matches all handlers'
    )

    t.end()
})