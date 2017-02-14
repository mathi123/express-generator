'use strict';

/**
 * Main module. Setups express app, perform initiation phases and start listening.
 */

require('app-module-path').addPath(__dirname + '/libs');

const app = require('express')(),
    logger = require('utils/logger').app,
    config = require('utils/config'),
    initializers = require('initializers');

async function main() {

    // Execute initializers
    <% if (locals.useMongo) {%>await initializers.mongoose(app);<%}%>
    <% if (locals.useSequelize) {%>await initializers.sequelize(app);<%}%>
    await initializers.models(app);
    await initializers.dictionaries(app);
    await initializers.middlewares(app);
    await initializers.routes(app.route);

    await new Promise((resolve, reject) =>
        app
        .listen(config.get('express:port'), resolve)
        .on('error', reject));

    logger.info('<%= appName%> application listening on port', config.get('express:port'))
}

main().catch(error => logger.error('Startup error', error));