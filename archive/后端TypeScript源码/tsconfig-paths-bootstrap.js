const tsConfig = require('./tsconfig.json')
const tsConfigPaths = require('tsconfig-paths')

const baseUrl = './src' // tsconfig.json中的baseUrl
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
})
