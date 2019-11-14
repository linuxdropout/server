import request, { Request, requestParams } from './Request'
import { Response } from './Response'
import { parsePath } from './utils'

export declare type reqHandler = (
    req: Request,
    res: Response,
    next: (error?: Error) => void
) => void

export declare type errHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: (error?: Error) => void
) => void

export declare type routingHandler = {
    method: string,
    handler: reqHandler | errHandler,
    order: number
}
export declare type handler = {
    method: string,
    handler: reqHandler | errHandler,
    order: number,
    path: string,
    params: requestParams
}

export declare interface routing {
    routes: Map<string, routing>
    handlers: Array<routingHandler>
}

export function setRouteHandler(
    routing: routing,
    method: string,
    pathParts: Array<string>,
    handler: reqHandler | errHandler,
    order: number = 0,
    pathIndex: number = 0,
) {
    if (pathIndex === pathParts.length) {
        routing.handlers.push({
            method,
            handler,
            order,
        })
        return
    }

    const nextPath = pathParts[pathIndex]
    const nextRouting = routing.routes.get(nextPath) || {
        handlers: [],
        routes: new Map(),
    }

    setRouteHandler(nextRouting, method, pathParts, handler, order, pathIndex + 1)
    routing.routes.set(nextPath, nextRouting)
}

export function getRouteHandlers(
    routing: routing,
    pathParts: Array<string>,
    methods: Array<string> = ['all'],
    pathIndex: number = 0,
    handlers: Array<handler> = [],
    params: requestParams = {},
) {
    for (const handler of routing.handlers) {
        if (methods.includes(handler.method)) {
            handlers.push({
                ...handler,
                path: pathParts.slice(0, pathIndex).join('/'),
                params,
            })
        }
    }

    for (const [routePath, route] of routing.routes) {
        const path = pathParts[pathIndex]

        if (routePath.charAt(0) === ':') {
            getRouteHandlers(
                route,
                pathParts,
                methods,
                pathIndex + 1,
                handlers,
                {
                    ...params,
                    [routePath.slice(1)]: path,
                },
            )
            continue
        }

        if (routePath === path.split('?').shift()) {
            getRouteHandlers(
                route,
                pathParts,
                methods,
                pathIndex + 1,
                handlers,
                params,
            )
            continue
        }
    }


    return pathIndex === 0
        ? handlers.sort(
            (handlerA, handlerB) => handlerA.order - handlerB.order,
        )
        : handlers
}

export function routeRequest(this: Router, req: Request, res: Response, done: (error?: Error) => void) {
    const { method, path: url, params: reqParams } = req

    const handlers = getRouteHandlers(
        this.routing,
        parsePath(url),
        ['all', method],
    )

    let handlerIndex = 0
    const next = (error?: Error): void => {
        if (!handlers[handlerIndex]) return done(error)

        const {
            handler,
            params,
            path,
        } = handlers[handlerIndex++]

        const routedRequest: Request = request(
            req,
            path,
            url,
            {
                params: {
                    ...reqParams,
                    ...params,
                },
                method,
            },
        )

        if (error) {
            return handler.length === 4
                ? (handler as errHandler)(error, routedRequest, res, next)
                : next(error)
        }

        if (handler.length < 4) {
            return (handler as reqHandler)(routedRequest, res, next)
        }

        return next()
    }

    next()
}

export abstract class Router {
    routing: routing = { handlers: [], routes: new Map() }
    routes: number = 0

    route(path: string, method: string, handler: reqHandler | errHandler): Router {
        setRouteHandler(
            this.routing,
            method,
            parsePath(path),
            handler,
            this.routes++,
        )
        return this
    }

    get(handler: reqHandler | errHandler): Router
    get(path: string, ...handler: Array<reqHandler | errHandler>): Router
    get(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'GET',
                handler,
            )
        }

        return this
    }

    head(handler: reqHandler | errHandler): Router
    head(path: string, ...handler: Array<reqHandler | errHandler>): Router
    head(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'HEAD',
                handler,
            )
        }

        return this
    }

    patch(handler: reqHandler | errHandler): Router
    patch(path: string, ...handler: Array<reqHandler | errHandler>): Router
    patch(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'PATCH',
                handler,
            )
        }

        return this
    }

    options(handler: reqHandler | errHandler): Router
    options(path: string, ...handler: Array<reqHandler | errHandler>): Router
    options(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'OPTIONS',
                handler,
            )
        }

        return this
    }

    put(handler: reqHandler | errHandler): Router
    put(path: string, ...handler: Array<reqHandler | errHandler>): Router
    put(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'PUT',
                handler,
            )
        }

        return this
    }

    delete(handler: reqHandler | errHandler): Router
    delete(path: string, ...handler: Array<reqHandler | errHandler>): Router
    delete(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'DELETE',
                handler,
            )
        }

        return this
    }

    post(handler: reqHandler | errHandler): Router
    post(path: string, ...handler: Array<reqHandler | errHandler>): Router
    post(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'POST',
                handler,
            )
        }

        return this
    }

    use(handler: reqHandler | errHandler): Router
    use(path: string, ...handler: Array<reqHandler | errHandler>): Router
    use(...args: Array<string | reqHandler | errHandler>): Router {
        const [path, handlers] = typeof args[0] === 'string'
            ? [args[0] as string, args.slice(1) as Array<reqHandler | errHandler>]
            : ['', args as Array<reqHandler | errHandler>]

        for (const handler of handlers) {
            this.route(
                path,
                'all',
                handler,
            )
        }

        return this
    }
}

export default function (): reqHandler & Router {
    const router: Router = {
        routing: { routes: new Map(), handlers: [] },
        routes: 0,
        route: Router.prototype.route,
        use: Router.prototype.use,
        get: Router.prototype.get,
        post: Router.prototype.post,
        patch: Router.prototype.patch,
        head: Router.prototype.head,
        delete: Router.prototype.delete,
        options: Router.prototype.options,
        put: Router.prototype.put,
    }

    return Object.assign(
        routeRequest.bind(router),
        router,
    )
}
