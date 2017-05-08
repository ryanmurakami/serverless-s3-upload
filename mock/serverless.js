module.exports.generate = (overrides) => {
  return Object.assign({}, {
    service: {
      custom: {
        upload: {

        }
      }
    },
    cli: {
      log: () => {}
    },
    getProvider: () => {}
  }, overrides)
}
