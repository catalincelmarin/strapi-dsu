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

async function sendNotificationToDevice(email,msg) {

  const message = msg
//  console.log("xxxx",message);
// These registration tokens come from the client FCM SDKs.
  return await admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:',email);//msg.token, response);
  })
  .catch((error) => {
    console.log('Error sending message:',email);
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
    strapi.log.info('In audit middleware.' + ctx.request.url + " " + ctx.request.method);
    console.log(ctx.request.body)
    if('POST' === ctx.request.method.toUpperCase() && ctx.request.url.trim()  === '/content-manager/collection-types/api::article.article') {
      const lastEntry = await strapi.entityService.findMany('api::audit.audit',{filters:{'admin_user':ctx.request.body["createdBy"]}});
      console.log(lastEntry,"xxx")
      if (length(lastEntry) > 0) {
         strapi.entityService.update('api::audit.audit',lastEntry[0]["id"],{ "data": 
            {

            "action":"Articol nou ",
            "admin_user":ctx.state.user.id,
            "ora":ctx.request.body["createdAt"]

        }});

      } else {
      strapi.entityService.create('api::audit.audit',{ "data": 
            {

            "action":"Articol nou",
            "admin_user":ctx.request.body["createdBy"],
            "ora":ctx.request.body["createdAt"]
            
        }}

      );
      }
      if(ctx.request.method.toUpperCase() == 'POST' && ctx.request.url.includes('api::alert.alert')) {
         console.log(ctx.request.body)
         const pozs = await strapi.entityService.findMany('api::pozition.pozition',{
                 "populate":{"utilizatori":true},
                 "filters":{
                 "utilizatori":{
                    "id":{"$eq":2}
                    }
                 }
	 });
         console.log(pozs[0])
         //strapi.entityService.update('api::alert.alert',{"data":{}})
      }      
      if(ctx.request.method.toUpperCase() == 'POST' && ctx.request.url.includes('/publish')) {

              const id = parseInt(ctx.request.url.match(/\d+/g))
              console.log("ID is ",id)
              let alert = {}
              if(!isNaN(id)) {
		console.log({"id":id})
                let alerts = await strapi.query('api::alert.alert').findMany({'id':id})
                alerts.forEach(el=>{
                    alert[el.locale]=el
                })
              }
              console.log(alert)
	      const data =  await strapi
        	  .query('plugin::users-permissions.user')
	          .findMany({'firebase_token':{"$null":false}});
           
	   data.forEach(doc=>{
        	    const msg = {
				  "token":doc["firebase_token"],
				  "notification":{
                                       "title":alert["ro"]["titlu"],
				       "body":alert["ro"]["titlu"]
                                   }
				}

	            if(doc["firebase_token"] !== null) {
//        	          console.log(msg)
//	                  strapi.log.error("SEND TO: " + doc["firebase_token"])
                	  sendNotificationToDevice(doc.email,msg)
        	    }
     	   })
       }
    }
      
    await next();
  };
};
