import { IncomingMessage } from 'http'

export declare type requestParams = {
    [index: string]: any
}

export default abstract class Request extends IncomingMessage {
    params: requestParams = {}
}
