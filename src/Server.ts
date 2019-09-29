import http from 'http'
import Response from './Response'
import Request from './Request'
import router, {
    parsePath,
    getRouteHandlers,
    routing,
    reqHandler,
    errHandler,
    Router
} from './Router'

class Server extends http.Server implements Router {
    routing: routing = { handlers: [], routes: new Map() }
    logger: typeof console

    constructor({ logger = console } = {}) {
        super()

        this.logger = logger
        this.on('request', this.handleRequest)
    }

    use(handler: reqHandler | errHandler): void
    use(path: string, handler: reqHandler | errHandler): void
    use(arg0: string | reqHandler | errHandler, arg1?: reqHandler | errHandler) { }
    // Replace with Router.use

    route(path: string, method: string, handler: reqHandler | errHandler) { }
    // Replace with Router.route

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
        const handlers = getRouteHandlers(this.routing, parsePath(url), ['all', method])

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

                return (handler as reqHandler)(req, res, next)
            }

            if (error) {
                return (handler as errHandler)(error, req, res, next)
            }

            return next()
        }

        next()
    }
}
Server.prototype.use = Router.prototype.use.bind(Server)
Server.prototype.route = Router.prototype.route.bind(Server)

export default Server