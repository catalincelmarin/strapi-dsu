module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', ''),
  url: env('URL',"https://dsu.stscloud.ro"),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
