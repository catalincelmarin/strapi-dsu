'use strict';
module.exports = {
  load: {
    before: ["responseTime", "logger", "cors", "responses", "gzip"],
    after: ["parser","body", "router"],
  }
};

var admin = require("firebase-admin");

var serviceAccount = require("./firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dsu-app-8e51f-default-rtdb.firebaseio.com"
});

async function sendNotificationToDevice({ token, data }) {
console.log(serviceAccount)
  const message = {
    "data":data,
    "token":token
  };
  console.log(message);
  return await admin
    .messaging()
    .send(message)
    .then((response) => response)
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}
/**
 * `audit` middleware
 */
const getService = (name) => {
  return strapi.plugin('users-permissions').service(name);
};

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    strapi.log.info('In audit middleware.');
    if(['POST','PUT','DELETE'].includes(ctx.request.method.toUpperCase()) && ctx.request.url.includes('api::alert.alert') ) {
      strapi.log.error('here');
      console.log(ctx.request.body)
      strapi.entityService.create('api::audit.audit',{ "data": 
            {

            "action":'New Content Entry',
            "admin_user":ctx.request.body["createdBy"],
            "ora":ctx.request.body["publishedAt"]
            
        }}
      );
      const data =  await strapi
          .query('plugin::users-permissions.user')
          .findMany({'firebase_token':{"$null":false}});

      data.forEach(doc=>{
            if(doc["firebase_token"] !== null) {
                  sendNotificationToDevice({"token":doc["firebase_token","data":{"test":"test"}})
            }
        })
    }
      
    await next();
  };
};
