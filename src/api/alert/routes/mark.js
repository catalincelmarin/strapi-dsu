module.exports = {
    routes: [
      {
       method: 'PUT',
       path: '/mark-read',
       handler: 'mark.markRead',
       config: {
         policies: [],
         middlewares: [],
       }
      }
    ],
  };
