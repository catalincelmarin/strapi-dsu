'use strict';

/**
 * unreg-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::unreg-user.unreg-user');
