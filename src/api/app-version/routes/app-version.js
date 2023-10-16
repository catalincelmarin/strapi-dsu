'use strict';

/**
 * app-version router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::app-version.app-version');
