# `@linuxdropout/server`

A simple express-like http Server designed to be ridiculously fast.

Haven't gathered performance metrics yet but the routing uses a recursive-tree lookup on some Maps and there's no regex or complicated matching allowed. So in theory, should be about as fast as it could be. Written in typescript.

## Usage

```sh
npm i --save @linuxdropout/server
```

```js
const { Server } = require('@linuxdropout/server')
const server = new Server()
const hostname = 'localhost'
const port = 8080

server.use((req, res, next) => {
    if (req.method === 'options') {
        return res.status(200).end()
    }
    next()
})

server.route('hello/:name', 'GET', (req, res, next) => {
    const { name } = req.params

    return res
        .setHeader('Content-Type', 'text/plain')
        .send(`Hello ${name}, I am ${hostname}:${port}`)
        .end()
})

server.listen(port)
```
