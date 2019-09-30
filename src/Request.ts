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
    baseUrl: string,
    url: string,
    props: {
        params: requestParams,
        method: string
    }
): Request {
    const path = baseUrl
        .split('/')
        .slice(url.split('/').length - 1)
        .join('/')

    return Object.assign(
        request,
        props,
        {
            baseUrl,
            path
        }
    )
}