'use strict';

/**
 * tnc service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::tnc.tnc');
