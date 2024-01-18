'use strict';

/**
 * A set of functions called "actions" for `mark`
 */

module.exports = {
  markRead: async (ctx, next) => {
    try {
      const {id,alerts} = ctx.request.body;
      if (!isNaN(id) && alerts) {
        const result = await strapi.query('plugin::users-permissions.user').update({where:{id:id},data:{'alerts':alerts}});
      }
      ctx.body = {'done':true};
    } catch (err) {
      ctx.body = err;
    }
  }
};
