'use strict';

/**
 * article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) =>  ({

  // Method 2: Wrapping a core action (leaves core logic in place)
  async findOne(ctx) {
    // some custom logic here
    
    ctx.query = { ...ctx.query, local: 'en' }
    const query = strapi.db.query('api::article.article');
                const article = await query.findOne({
                  where: {
                    id: ctx.params.id,
                  },
                  populate: ['createdBy'],
                });
                //console.log(article)
    // Calling the default core action
    const { data, meta } = await super.findOne(ctx);
    //console.log(data)
    // some more custom logic
    meta.date = Date.now()
    data['createdBy'] = article['createdBy']

    return { data, meta };
  },

}));
