import { ServerResponse } from 'http'
import defaults from './defaults'

export abstract class Response extends ServerResponse {
    append(headerKey: string, value: Array<string> | string) {
        const header = this.getHeader(headerKey)

        if (header === void 0) {
            if (typeof value === 'string') {
                return this.setHeader(headerKey, value)
            }
            return this.setHeader(headerKey, value.join(', '))
        }

        if (typeof value === 'string') {
            return this.setHeader(headerKey, [header, value].join(', '))
        }

        return this.setHeader(headerKey, [header, ...value].join(', '))
    }

    status(statusCode: number, statusMessage: string = defaults.statusMessage[statusCode]) {
        this.statusCode = statusCode
        this.statusMessage = statusMessage

        return this
    }

    send(body: string | Buffer | Array<any> | object) {
        if (typeof body === 'string' || body instanceof Buffer) {
            this.write(body)
            return this
        }

        try {
            const json = JSON.stringify(body)
            this.setHeader('Content-Type', 'application/json')
            this.write(json)
        } catch (err) {
            this.write(
                body.toString instanceof Function
                    ? body.toString()
                    : `${body}`
            )
        }

        return this
    }

    json(body: object) {
        this.setHeader('Content-Type', 'application/json')
        this.write(JSON.stringify(body))

        return this
    }

    setHeader(key: string, value: string) {
        super.setHeader(key, value)
        return this
    }
    end() {
        super.end()
        return this
    }
}

export default function (response: ServerResponse): Response {
    return Object.assign(
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
}