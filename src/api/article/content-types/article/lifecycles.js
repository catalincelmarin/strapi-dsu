// ./src/api/[api-name]/content-types/[api-name]/lifecycles.js

module.exports = {
  beforeCreate(event) {
    const { data, where, select, populate } = event.params;

    // let's do a 20% discount everytime
    console.log("before")
  },

  async afterCreate(event) {
    const { result, params } = event;
    const lastEntry = await strapi.entityService.findMany('api::audit.audit',{
      filters:{'admin_user':result["createdBy"]["id"]}
    });
    console.log(lastEntry)
    if (lastEntry.length > 0) {
      strapi.entityService.update('api::audit.audit',lastEntry[0]["id"],{ "data":
          {

            "action":"Articol nou " + result["id"],
            "admin_user":result["createdBy"]["id"],
            "ora":result["createdAt"]

          }});

    } else {
      strapi.entityService.create('api::audit.audit', {
          "data":
            {

              "action": "Articol nou " + result["id"],
              "admin_user":result["createdBy"]["id"],
              "ora":result["createdAt"]

            }
        }
      );
    }
    // do something to the result;
  },
};
