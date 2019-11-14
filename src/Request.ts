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
    queryString: string = ''
}

export default function (
    request: IncomingMessage,
    baseUrl: string,
    pathname: string,
    props: {
        params: requestParams,
        method: string,
        queryString: string
    },
): Request {
    const matchedPathLength = parsePath(baseUrl).length
    const path = parsePath(pathname)
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
