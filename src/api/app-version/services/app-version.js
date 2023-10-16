'use strict';

/**
 * app-version service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::app-version.app-version');
