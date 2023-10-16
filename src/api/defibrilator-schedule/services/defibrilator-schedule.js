'use strict';

/**
 * defibrilator-schedule service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::defibrilator-schedule.defibrilator-schedule');
