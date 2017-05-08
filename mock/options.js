module.exports.generate = (overrides) => {
  return Object.assign({}, {
    stage: '',
    region: ''
  }, overrides)
}
