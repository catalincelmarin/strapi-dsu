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

async function sendNotificationToDevice(email, msg) {

  const message = {
    "data":{"title":"Test","body":"Test","click_action":null,"icon":null},
    "token":msg.token
  };
  console.log("xxxx",message);
// These registration tokens come from the client FCM SDKs.
  return await admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:',email, response);
  })
  .catch((error) => {
    console.log('Error sending message:',email, error);
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
      strapi.entityService.create('api::audit.audit',{ "data": 
            {

            "action":'New Content Entry',
            "admin_user":ctx.request.body["createdBy"],
            "ora":ctx.request.body["publishedAt"]
            
        }}

      );
      if(ctx.request.method.toUpperCase() == 'POST') {
	      const data =  await strapi
        	  .query('plugin::users-permissions.user')
	          .findMany({'firebase_token':{"$null":false}});

	   data.forEach(doc=>{
        	    const msg = {"token":doc["firebase_token"],"data":{"test":"test"}}

	            if(doc["firebase_token"] !== null) {
        	          console.log(msg)
	                  strapi.log.error("SEND TO: " + doc["firebase_token"])
                	  sendNotificationToDevice(doc["email"],msg)
        	    }
     	   })
       }
    }
      
    await next();
  };
};
