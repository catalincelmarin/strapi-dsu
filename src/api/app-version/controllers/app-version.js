'use strict';

/**
 * app-version controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::app-version.app-version');
