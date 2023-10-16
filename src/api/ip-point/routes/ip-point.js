'use strict';

/**
 * ip-point router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::ip-point.ip-point');
