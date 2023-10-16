'use strict';

/**
 * defibrilator router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::defibrilator.defibrilator');
