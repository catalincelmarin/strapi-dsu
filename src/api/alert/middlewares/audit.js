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

async function sendNotificationToDevice(token,msg) {

  const message = msg
//  console.log("xxxx",message);
// These registration tokens come from the client FCM SDKs.
  return await admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:',token);//msg.token, response);
  })
  .catch((error) => {
    console.log('Error sending message:',token);
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
    console.log(await strapi.store.get("user"))


      if(ctx.request.method.toUpperCase() == 'POST' && ctx.request.url.includes('api::alert.alert') && ctx.request.url.includes('/publish')) {

              const id = parseInt(ctx.request.url.match(/\d+/g))
              console.log("ID is ",id)
              let alert = {}
              if(!isNaN(id)) {
		            console.log({"id":id})
                let alerts = await strapi.query('api::alert.alert').findMany({'id':id,'populate':['judete']})
                alerts.forEach(el=>{
                    alert[el.locale]=el
                })
              }
              let counties = alert['ro']['judete'].map(el=>el["id"])
              let whereCondition = {id:{"$null":false}};
              let unregs = []
              if(counties.length) {
                whereCondition = {
                  'firebase_token': {"$null": false},
                  'judete':{
                    $or:[{
                      id: {
                        $contains: counties
                      }},
                      {id:{$null:true}}]
                  }
                }
              } else {
                 unregs =  await strapi
                  .query('api::unreg-user.unreg-user')
                  .findMany({
                    'firebase_token': {"$null": false},
                  });


              }

	      let data =  await strapi
        	  .query('plugin::users-permissions.user')
	          .findMany({
              where: whereCondition
            });
        data = [...data,unregs]
	      data.forEach(doc=>{
        	    const msg = {
				  "token":doc["firebase_token"],
				  "notification":{
                                       "title":alert["ro"]["titlu"],
				       "body":alert["ro"]["titlu"]
                                   }
				}

	            if(doc["firebase_token"] !== null) {
                	  sendNotificationToDevice(doc["firebase_token"],msg)
        	    }
     	   })
    }

    await next();
  };
};
