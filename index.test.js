/* global describe, test, expect, jest */

const Plugin = require('./')
const slsMock = require('./mock/serverless').generate()
const optionsMock = require('./mock/options').generate()

describe('Serverless S3 plugin', () => {
  test('the module should export a class function', () => {
    expect(Plugin).toEqual(expect.any(Function))
  })

  test('a created instance should have the correct methods', () => {
    const testPlugin = new Plugin(slsMock, optionsMock)
    expect(testPlugin.execute).toEqual(expect.any(Function))
    expect(testPlugin._convertAsterix).toEqual(expect.any(Function))
    expect(testPlugin._getOptions).toEqual(expect.any(Function))
    expect(testPlugin._log).toEqual(expect.any(Function))
    expect(testPlugin._readDirectory).toEqual(expect.any(Function))
    expect(testPlugin._shouldIgnore).toEqual(expect.any(Function))
    expect(testPlugin._uploadFile).toEqual(expect.any(Function))
    expect(testPlugin._validateOptions).toEqual(expect.any(Function))
  })

  test('_convertAsterix should turn asterix into regex', () => {
    const testPlugin = new Plugin(slsMock, optionsMock)
    testPlugin.pluginOptions.ignores = [
      '*.js'
    ]

    testPlugin._convertAsterix()

    expect(testPlugin.pluginOptions.ignores).toEqual([ '\\.+.js' ])
  })
})
