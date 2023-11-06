module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'strapi-provider-email-smtp',
      providerOptions: {
        host:'mail.mai.gov.ro', // 'smtp.gmail.com', //'mail.igsu.ro', //SMTP Host
        port: 587, //SMTP Port
        secure: false,
//        auth:{
        username: 'noreply.dsuapp@mai.gov.ro', //'nababull@gmail.com', //'dsuapp@igsu.ro',
        password: 'k4kwbKCz....', //},
//        tls:{
            rejectUnauthorized: false
//        }
//        rejectUnauthorized: true,
//        requireTLS: true,
//        connectionTimeout: 25,
      },
    settings: {
      defaultFrom: 'noreply.dsuapp@mai.gov.ro',
      defaultReplyTo: 'noreply.dsuapp@mai.gov.ro',
      from:{
          email: 'noreply.dsuapp@mai.gov.ro',
          name: 'Ministerul Afacerilor Interne'
      },
      response_email:'noreply.dsuapp@mai.gov.ro'
    },
},
  },
});
