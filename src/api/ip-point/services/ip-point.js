'use strict';

/**
 * ip-point service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ip-point.ip-point');
