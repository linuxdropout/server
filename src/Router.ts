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
        return routing.handlers.push({
            method,
            handler,
            order
        })
    }

    const nextPath = pathParts[pathIndex]
    const nextRouting = routing.routes.get(nextPath) || {
        handlers: [],
        routes: new Map()
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
    params: requestParams = {}
) {
    for (const handler of routing.handlers) {
        if (methods.includes(handler.method)) {
            handlers.push({
                ...handler,
                path: pathParts.slice(0, pathIndex).join('/'),
                params
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
                    [routePath.slice(1)]: path
                }
            )
            continue
        }

        if (routePath === path) {
            getRouteHandlers(
                route,
                pathParts,
                methods,
                pathIndex + 1,
                handlers,
                params
            )
            continue
        }
    }


    return pathIndex === 0
        ? handlers.sort(
            (handlerA, handlerB) => handlerA.order - handlerB.order
        )
        : handlers
}

export function routeRequest(this: Router, req: Request, res: Response, done: (error?: Error) => void) {
    const { method, path: url, params: requestParams, baseUrl } = req

    const handlers = getRouteHandlers(
        this.routing,
        parsePath(url),
        ['all', method]
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
                    ...requestParams,
                    ...params
                },
                method
            }
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
            this.routes++
        )
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
        use: Router.prototype.use
    }

    return Object.assign(
        routeRequest.bind(router),
        router
    )
}