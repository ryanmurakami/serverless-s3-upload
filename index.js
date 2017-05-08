const fs = require('fs')
const path = require('path')
const mimeTypes = require('mime-types')
const glob = require('glob')

const DEFAULT_FILE_CONTENT_TYPE = 'application/octet-stream'
const GLOBAL_GLOB_PATTERN = '**/*'

class S3UploadPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options
    this.pluginOptions = this._getOptions()
    this.provider = this.serverless.getProvider('aws')

    this._convertAsterix()

    this.commands = {
      upload: {
        usage: 'Uploads a group of files to an S3 bucket',
        lifecycleEvents: [
          'upload'
        ]
      }
    }

    this.hooks = {
      'upload:upload': this.execute.bind(this),
      'after:deploy:deploy': this.execute.bind(this)
    }
  }

  execute () {
    return new Promise((resolve, reject) => {
      const readPromises = []

      if (!this.pluginOptions.files) {
        readPromises.push(this._readDirectory(this.pluginOptions.dir, GLOBAL_GLOB_PATTERN))
      } else if (typeof this.pluginOptions.files === 'string') {
        readPromises.push(this._readDirectory(this.pluginOptions.dir, this.pluginOptions.files))
      } else {
        for (const ptn of this.pluginOptions.files) {
          readPromises.push(this._readDirectory(this.pluginOptions.dir, ptn))
        }
      }

      Promise.all(readPromises)
      .then(resolve)
      .catch((err) => {
        this._log(err.stack)
        reject(err)
      })
    })
  }

  _convertAsterix () {
    const ignores = this.pluginOptions.ignores

    if (!ignores) return

    this.pluginOptions.ignores = ignores.map((pattern) => {
      if (pattern.includes('*')) {
        return pattern.replace(/\*/g, '\.+')
      }
      return pattern
    })
  }

  _getOptions () {
    return this._validateOptions(this.serverless.service.custom.upload)
  }

  _log (msg) {
    this.serverless.cli._log(msg)
  }

  _readDirectory (dirPath, pattern) {
    return new Promise((resolve, reject) => {
      glob(path.join(dirPath, pattern), (err, files) => {
        if (err) return reject(`Error globbing directory ${dirPath}`)

        const promises = []

        files.forEach((file) => {
          if (this._shouldIgnore(file)) {
            this._log(`\tSkipping: ${file}`)
            return
          }
          promises.push(this._uploadFile(file))
        })

        Promise.all(promises)
        .then(resolve)
        .catch(reject)
      })
    })
  }

  _shouldIgnore (filename) {
    let ignore = false

    for (const ignFile of this.pluginOptions.ignores) {
      if (filename.match(ignFile)) {
        ignore = true
      }
    }

    return ignore
  }

  _uploadFile (filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, file) => {
        if (err) return reject(`\tCould not load file ${filePath}. Error: ${err.stack}`)

        this.provider.request('S3', 'putObject', {
          ACL: this.pluginOptions.acl || 'public-read',
          Body: file,
          Bucket: this.pluginOptions.bucket,
          Key: filePath,
          ContentType: mimeTypes.lookup(filePath) || DEFAULT_FILE_CONTENT_TYPE
        }, this.options.stage, this.options.region)
        .then(() => {
          this._log(`\tUploaded: ${filePath}`)
          resolve()
        })
        .catch((err) => {
          reject(`\tError uploading file to S3 with ${err.stack}`)
        })
      })
    })
  }

  _validateOptions (options) {
    return options
  }
}

module.exports = S3UploadPlugin
