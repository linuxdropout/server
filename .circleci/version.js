const rl = require('readline')

const input = rl.createInterface(process.stdin)

let major = false
let minor = false

input.on('line', line => {
    const commitLine = line.trim()
    if (!commitLine) return
    if (line.match(/breaking\schange:?/gi)) {
        major = true
        input.close()
    }
    if (line.match(/^\s*feat\(?[^\)]*\)?:?\s/gi)) {
        minor = true
    }
})

input.on('close', () => {
    process.stdout.write(major ? 'major' : minor ? 'minor' : 'patch')
})