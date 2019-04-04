const globby = require('globby')
const registerAPI = fastify => APIConstructor => {
  const apisInstance = new APIConstructor(fastify)
  const apisName = Object.getOwnPropertyNames(
    Object.getPrototypeOf(apisInstance)
  ).filter(key => key !== 'constructor')
  apisName.map(apiName => {
    const { routes } = apisInstance[apiName]
    fastify
      .register(async (fastify, options) => {
        routes.map(route => {
          const { method, url, schema } = route
          fastify.route({
            url: `/${APIConstructor.name.toLocaleLowerCase()}${url}`,
            method,
            handler: apisInstance[apiName],
            schema
          })
        })
      })
      .after(() => {
        delete apisInstance[apiName].routes
      })
  })
}

module.exports = async (fastify, options, next) => {
  let { path: apiDirectory } = options
  if (!apiDirectory) {
    throw new Error('需要传path参数以指明api的目录')
  }
  const apiPaths = await globby(apiDirectory)
  apiPaths.map(require).forEach(registerAPI(fastify))
  next()
}
