import http from 'http'
import Response from './Response'
import Request, { requestParams } from './Request'

export declare type reqHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (error?: Error) => void
) => void

export declare type errHandler = (
    error: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (error?: Error) => void
) => void

export declare interface routing {
    routes: Map<string, routing>
    handlers: Array<[string, reqHandler | errHandler]>
}

function setRouteHandler(routing: routing, urlParts: Array<string>, method: string, handler: reqHandler | errHandler) {
    const part = urlParts.shift()

    if (!part) {
        return routing.handlers.push([method, handler])
    }

    const nextRouting = routing.routes.get(part) || {
        routes: new Map(),
        handlers: []
    }

    setRouteHandler(nextRouting, urlParts, method, handler)
    routing.routes.set(part, nextRouting)
}

function getRouteHandlers(
    routing: routing,
    urlParts: Array<string>,
    methods: Array<string> = ['all'],
    handlers: Array<[reqHandler | errHandler, requestParams]> = [],
    params: requestParams = {}
): Array<[reqHandler | errHandler, requestParams]> {
    for (const [method, handler] of routing.handlers) {
        if (methods.includes(method)) {
            handlers.push([handler, params])
        }
    }

    const part = urlParts[0]
    if (part === void 0) return handlers

    for (const [key, value] of routing.routes) {
        if (key === part) {
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, params)
            continue
        }
        if (key.charAt(0) === ':') {
            const paramKey = key.slice(1)
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, { ...params, [paramKey]: part })
            continue
        }
    }

    return handlers
}

export default class Server extends http.Server {
    routing: routing = { handlers: [], routes: new Map() }
    logger: typeof console

    constructor({ logger = console } = {}) {
        super()

        this.logger = logger
        this.on('request', this.handleRequest)
    }

    use(handler: reqHandler | errHandler): void
    use(path: string, handler: reqHandler | errHandler): void
    use(arg0: string | reqHandler | errHandler, arg1?: reqHandler | errHandler) {
        const [path, handler] = typeof arg0 === 'string'
            ? [arg0, arg1]
            : ['', arg0]

        setRouteHandler(this.routing, path.split('/'), 'all', handler as reqHandler | errHandler)
    }

    route(path: string, method: string, handler: reqHandler | errHandler) {
        setRouteHandler(this.routing, path.split('/'), method, handler as reqHandler | errHandler)
    }

    handleRequest(request: Request, response: Response) {
        const res: Response = Object.assign(
            response,
            {
                append: Response.prototype.append.bind(response),
                status: Response.prototype.status.bind(response),
                send: Response.prototype.send.bind(response),
                json: Response.prototype.json.bind(response),
                setHeader: Response.prototype.setHeader.bind(response),
                end: Response.prototype.end.bind(response)
            }
        )

        if (!request.url || !request.method) {
            return res.status(400).end()
        }

        const { url, method } = request
        const handlers = getRouteHandlers(this.routing, url.split('/').slice(1), ['all', method])

        const done = (error?: Error) => {
            if (!res.finished) {
                if (!res.headersSent) {
                    res.status(error ? 500 : 404)
                }
                if (error) {
                    this.logger.error(error)
                    res.write(`${error}`)
                }
                res.end()
            }
        }

        const next = (error?: Error): void => {
            const nextHandler = handlers.shift()
            if (!nextHandler) return done(error)
            const [handler, params] = nextHandler

            const req: Request = Object.assign(
                request,
                {
                    params
                }
            )

            if (handler.length === 3) {
                if (error) return next(error)

                return (handler as reqHandler).bind(this)(req, res, next)
            }

            if (error) {
                return (handler as errHandler).bind(this)(error, req, res, next)
            }

            return next()
        }

        next()
    }
}