module.exports = {
      routes: [
        {
         method: 'GET',
         path: '/get-scheduled',
         handler: 'scheduled.getScheduled',
         config: {
           policies: [],
           middlewares: [],
         },
        },
      ],
    };
