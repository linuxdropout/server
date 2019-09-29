import http from 'http'
import { Request, requestParams } from './Request'
import { Response } from './Response'

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

export declare interface routing {
    routes: Map<string, routing>
    handlers: Array<[string, reqHandler | errHandler]>
}

export function parsePath(path: string) {
    return path
        .split('/')
        .filter(route => route !== '')
}

export function setRouteHandler(routing: routing, urlParts: Array<string>, method: string, handler: reqHandler | errHandler) {
    const part = urlParts.shift()

    if (!part) return routing.handlers.push([method, handler])

    const nextRouting = routing.routes.get(part) || {
        routes: new Map(),
        handlers: []
    }

    setRouteHandler(nextRouting, urlParts, method, handler)
    routing.routes.set(part, nextRouting)
}

export function getRouteHandlers(
    routing: routing,
    urlParts: Array<string>,
    methods: Array<string> = ['all'],
    handlers: Array<[reqHandler | errHandler, requestParams]> = [],
    params: requestParams = {}
): Array<[reqHandler | errHandler, requestParams]> {
    const part = urlParts[0]

    for (const [method, handler] of routing.handlers) {
        if (methods.includes(method)) {
            handlers.push([handler, params])
        }
    }

    if (part !== void 0) {
        for (const [key, value] of routing.routes) {
            if (key.charAt(0) === ':') {
                const paramKey = key.slice(1)
                getRouteHandlers(value, urlParts.slice(1), methods, handlers, { ...params, [paramKey]: part })
                continue
            }
            if (key === part) {
                getRouteHandlers(value, urlParts.slice(1), methods, handlers, params)
                continue
            }
        }
    }

    return handlers
}

export function handleRequest(this: Router, req: Request | http.IncomingMessage, res: Response, done: (error?: Error) => void) {
    if (!req.url || !req.method) {
        res.status(400).end()
        return
    }

    const { url, method } = req
    const handlers = getRouteHandlers(this.routing, parsePath(url), ['all', method])

    const next = (error?: Error): void => {
        const nextHandler = handlers.shift()
        if (!nextHandler) return done(error)
        const [handler, params] = nextHandler

        const reqWithParams: Request = Object.assign(
            req,
            {
                params
            }
        )

        if (handler.length === 3) {
            if (error) return next(error)

            return (handler as reqHandler)(reqWithParams, res, next)
        }

        if (error) {
            return (handler as errHandler)(error, reqWithParams, res, next)
        }

        return next()
    }

    next()
}

export abstract class Router {
    routing: routing = { handlers: [], routes: new Map() }
    logger: typeof console = console

    use(handler: reqHandler | errHandler): void
    use(path: string, handler: reqHandler | errHandler): void
    use(arg0: string | reqHandler | errHandler, arg1?: reqHandler | errHandler): void {
        const [path, handler] = typeof arg0 === 'string'
            ? [arg0, arg1]
            : ['', arg0]


        setRouteHandler(this.routing, parsePath(path), 'all', handler as reqHandler | errHandler)
    }

    route(path: string, method: string, handler: reqHandler | errHandler) {
        setRouteHandler(this.routing, parsePath(path), method, handler as reqHandler | errHandler)
    }
}

export default function ({ logger = console } = {}): Router & reqHandler {
    const routingContext = {
        logger,
        routing: { routes: new Map(), handlers: [] },
    }

    const router: Router = Object.assign(
        routingContext,
        {

            use: Router.prototype.use.bind(routingContext),
            route: Router.prototype.route.bind(routingContext)
        }
    )

    return Object.assign(handleRequest.bind(router), router)
}