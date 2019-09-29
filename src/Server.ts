import http from 'http'
import createResponse, { Response } from './Response'
import createRequest, { Request } from './Request'
import router, {
    parsePath,
    getRouteHandlers,
    routing,
    reqHandler,
    errHandler,
    Router
} from './Router'

export class Server extends http.Server implements Router {
    routing: routing = { handlers: [], routes: new Map() }
    logger: typeof console

    constructor({ logger = console } = {}) {
        super()

        this.logger = logger
        this.on('request', this.handleRequest)
    }

    use = Router.prototype.use
    route = Router.prototype.route

    handleRequest(request: Request, response: Response) {
        const res = createResponse(response)

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
            const req = createRequest(request, { params })

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

export default function createServer({ logger = console } = {}) {
    return new Server({ logger })
}