import { IncomingMessage } from 'http'
import { parsePath } from './utils'

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
    baseUrl: string,
    url: string,
    props: {
        params: requestParams,
        method: string
    },
): Request {
    const matchedPathLength = parsePath(baseUrl).length
    const path = parsePath(url)
        .slice(matchedPathLength)
        .join('/')

    return Object.assign(
        request,
        props,
        {
            baseUrl,
            path,
        },
    )
}
