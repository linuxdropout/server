import { IncomingMessage } from 'http'

export declare type requestParams = {
    [index: string]: any
}

export abstract class Request extends IncomingMessage {
    params: requestParams = {}
}

export default function (request: IncomingMessage, props: { params: requestParams } = { params: {} }): Request {
    return Object.assign(
        request,
        props
    )
}