import { IncomingMessage } from 'http'

export declare type requestParams = {
    [index: string]: any
}

export abstract class Request extends IncomingMessage {
    params: requestParams = {}
    path: string = '/'
    baseUrl: string = '/'
    method: string = 'all'
}

export default function (
    request: IncomingMessage,
    props: {
        path: string,
        baseUrl: string,
        params: requestParams,
        method: string
    }
): Request {
    return Object.assign(
        request,
        props
    )
}