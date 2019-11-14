import http from 'http'
import { statusMessage } from './defaults'
import createResponse, { Response } from './Response'
import createRequest, { Request } from './Request'
import {
    routing,
    routeRequest,
    Router,
} from './Router'

export class Server extends http.Server implements Router {
    routing: routing = { handlers: [], routes: new Map() }
    routes: number = 0

    constructor() {
        super()
        this.on('request', this.handleRequest)
    }

    use = Router.prototype.use
    route = Router.prototype.route
    get = Router.prototype.get
    post = Router.prototype.post
    patch = Router.prototype.patch
    head = Router.prototype.head
    delete = Router.prototype.delete
    options = Router.prototype.options
    put = Router.prototype.put

    handleRequest(request: http.IncomingMessage, response: http.ServerResponse): void {
        const { url, method } = request

        if (!url || !method) {
            response.statusCode = 400
            response.statusMessage = statusMessage[400]
            return response.end()
        }
        const [pathname, queryString] = url.split('?')

        const res: Response = createResponse(
            response,
        )
        const req: Request = createRequest(
            request,
            '',
            pathname,
            {
                method,
                params: {},
                queryString
            },
        )

        const done = (error?: Error) => {
            if (!res.finished) {
                if (!res.headersSent) {
                    res.status(error ? 500 : 404)
                }
                if (error) {
                    res.write(`${error}`)
                }
                res.end()
            }
        }

        return routeRequest.bind(this)(req, res, done)
    }
}

export default function createServer() {
    return new Server()
}
