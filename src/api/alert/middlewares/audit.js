'use strict';
module.exports = {
  load: {
    before: ["responseTime", "logger", "cors", "responses", "gzip"],
    after: ["parser","body", "router"],
  }
};

var admin = require("firebase-admin");

const fs = require('fs');
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

    await next();
    strapi.log.info('In audit middleware.' + ctx.request.url + " " + ctx.request.method);
    if(ctx.request.method.toUpperCase() == 'POST' && ctx.request.url.includes('test')) {
      
      const {data} = ctx.request.body
      const tkn2 = "fox7OI1x1UH8oHnxsR-OQj:APA91bHgi5CpTMdYJZ_KhZwv5aCYBB-B8_ODIJQcx1_o0FAiBiUMdDcQurcv0mCXi4nflg5zCUY0G_EIq7u-p2Tn5ywuxYAyV2PcNIueWvlJPeUjNgiectoslR2KKaVuX1VBvr9DHFu5";
      const tkn3 = "d2ItGAxnAUM-p5U_230ZDb:APA91bEg8mNXVGYUA1Oo2cy7BJadMS7YZ-MLxTZ9gdWwM-fCezNM-ym3zQQZqse_lNryUQ10YYyaj8zWz_x6fWt7whOLvd6APdzcaYmaDfqfWgaC79YjAjxvcGomPGVrtQz95s0Zjuvv";
      const tkn = "cdjeGauzYkoClnu1rQm8GQ:APA91bHY-tV9ouObGeT1n0E8b7bLqZYP6200-vaKa_mdNdH2zU2Sor1zfImRHXbZRV_jpHnZ189yaqWzycYeHRWCH3NjgUjkGCBn6N8zwu590gkQgymjOt9gTPIAsQ0h701e1srwmQCc";
      
      const msg = {
        "token":data.token,
        "notification":{
        	"title":"Alert title",
	        "body":"" + (data.token ? data.token : "no token" ),
        	//"click_action":{
	        //"alertId":(!isNaN(alert["id"]) ? alert["id"] : alert["ro"]["id"])
        	//}
          },"data":{
             "alertId":"59"
          },"apns":{
		      "payload":{
			      "aps":{
              "sound":"default",
              "contentAvailable":true
            }
          }
                //"headers":{
                  //      "apns-push-type":"background"
                        //"apns-priority":"5"
                        //"apns-topic":"ro.orson.dsu"
                //}
	        }
        };

        sendNotificationToDevice(tkn,msg);
        return;

      }


      if(ctx.request.method.toUpperCase() == 'POST' && 
          ctx.request.url.includes('api::alert.alert') && ctx.request.url.includes('/unpublish')) {
          let content = ctx.request.url + " | " + ctx.request.method;
          fs.appendFile('/logs/file.log', content + "\n", err => {
                        if (err) {
                    console.error(err);
                  }
                  // done!
          });
      }

      //console.log("BODY:",ctx.request.body);
      if(ctx.request.method.toUpperCase() == 'POST' && 
          ctx.request.url.includes('api::alert.alert') && 
          ctx.request.url.includes('/publish')) {
              
              let content = ctx.request.url + " | " + ctx.request.method;
              fs.appendFile('/logs/file.log', content + "\n", err => {
                  if (err) {
                  console.error(err);
                  }
              });

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
                // @ts-ignore
                whereCondition = {
                  'firebase_token': {"$null": false},
                  'push_notify':{"$eq":true},
                  'judete':{
                    $or:[{
                      id: {
                        '$in': counties
                      }},
                      {id:{'$null':true}}]
                  }
                }
              } else {
                 unregs =  await strapi
                  .query('api::unreg-user.unreg-user')
                  .findMany({
                    'firebase_token': {"$null": false}
                  });


              }

            let data =  await strapi
                .query('plugin::users-permissions.user')
                .findMany({
                  populate: {"judete":true},
                  where: whereCondition
                });

            data = [...data,unregs]
            const alreadySent = [];
            
            let send = data.filter(doc => ( doc["username"] !== undefined && 
                      doc["firebase_token"] !== undefined && 
                      doc["firebase_token"] !== null)).
                      filter(doc => doc["username"].includes("orson.ro")).
                      map(doc=>{
                        console.log(doc["username"]);
                        return doc["firebase_token"];
                      });
                		
                    
            console.log(send);
            for(let i = 0; i < send.length; i+= 500) {
                let batch = send.slice(i,i+500);
            
                let msg = {
                    "tokens":batch,
                    "notification":{
                        "title":alert["ro"]["titlu"],
                        "body":alert["ro"]["titlu"]
                    },"data":{
                        "alertId": "" + id
                    },"apns":{
                      "payload":{
                      "aps":{
                      "sound":"default",
                      "contentAvailable":true
                        }
                      }
                  }
                }

                
                try {
                  admin.messaging().sendMulticast(msg).then((response)=>{
                      const {successCount,failureCount} = response
                      const result = `sent ${successCount} | failed ${failureCount}`;
                      console.log(result)
                      fs.appendFile('/logs/file.log', result + "\n", err => {
                                if (err) {
                                   console.error(err);
                                }
                      });
                  }).catch((err)=>{
                      const errStr = JSON.stringify(err);

                      fs.appendFile('/logs/file.log', errStr + "\n", err => {
                                if (err) {
                                   console.error(err);
                                }
                      });
                  });
                } catch( err ){
                       fs.appendFile('/logs/file.log',  JSON.stringify(err) + "\n", err => {
                                if (err) {
                                    console.error(err);
                                }
                       });
                }
        }
        return;

    }

    
  };
};

