const config = {
   
};

exports.github = {
  host: process.env.GHE_HOST || config.gheHost || 'github.com',
  apiHost: process.env.GHE_API_HOST || config.gheHost || 'api.github.com',
  protocol: process.env.GHE_PROTOCOL || config.gheProtocol || 'https',
  pathPrefix: process.env.GHE_PATH_PREFIX || config.ghePathPrefix,
  port: process.env.GHE_PORT || config.ghePort || 443
};