const path = require('path')
const fs = require('fs')
const ts = require('typescript')

function loadColorsFromTs() {
    const tsPath = path.resolve(__dirname, '../../theme/colors.ts')
    const sourceCode = fs.readFileSync(tsPath, 'utf8')
    const transpiled = ts.transpileModule(sourceCode, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    })
    const Module = require('module')
    const m = new Module(tsPath, module)
    m.paths = Module._nodeModulePaths(path.dirname(tsPath))
    m._compile(transpiled.outputText, tsPath)
    return m.exports.COLORS || (m.exports.default && m.exports.default.COLORS) || m.exports
}

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
function createConfig(config) {
    const imported = loadColorsFromTs()
    const colors = Object.keys(imported).reduce((acc, key) => {
        const value = imported[key]
        acc[key] = { light: value }
        return acc
    }, {})

    return {
        type: 'widget',
        icon: '../../assets/icon.png',
        entitlements: {
            'com.apple.security.application-groups':
                config.ios.entitlements['com.apple.security.application-groups'],
        },
        colors,
        images: {
            AppIconImage: '../../assets/icon.png',
        },
    }
}

module.exports = createConfig
