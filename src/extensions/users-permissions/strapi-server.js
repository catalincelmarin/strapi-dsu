const crypto = require('crypto');
const http = require('https');
const _ = require('lodash');
const utils = require('@strapi/utils');
const bcrypt = require('bcryptjs');
const urlJoin = require('url-join');
const getService = (name) => {
  return strapi.plugin('users-permissions').service(name);
};
const { yup, validateYupSchema } = require('@strapi/utils');

const callbackSchema = yup.object({
  identifier: yup.string().required(),
  password: yup.string().required(),
});

const registerSchema = yup.object({
  email: yup.string().email().required(),
  username: yup.string().required(),
  password: yup.string().required(),
});

const sendEmailConfirmationSchema = yup.object({
  email: yup.string().email().required(),
});

const validateEmailConfirmationSchema = yup.object({
  confirmation: yup.string().required(),
});

const forgotPasswordSchema = yup
  .object({
    email: yup.string().email().required(),
  })
  .noUnknown();

const resetPasswordSchema = yup
  .object({
    password: yup.string().required(),
    passwordConfirmation: yup.string().required(),
    code: yup.string().required(),
  })
  .noUnknown();

const changePasswordSchema = yup
  .object({
    password: yup.string().required(),
    passwordConfirmation: yup
      .string()
      .required()
      .oneOf([yup.ref('password')], 'Passwords do not match'),
    currentPassword: yup.string().required(),
  })
  .noUnknown();

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

const validateCallbackBody = validateYupSchema(callbackSchema);
const validateRegisterBody = validateYupSchema(registerSchema);


const editme = async (userId, params = {}) => {
    return strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: params,
      populate: ['role'],
    });
  }
const sendConfirmationEmail = async (user) =>  {
    
    const userPermissionService = getService('users-permissions');
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const userSchema = strapi.getModel('plugin::users-permissions.user');

    const settings = await pluginStore
      .get({ key: 'email' })
      .then((storeEmail) => storeEmail.email_confirmation.options);

    // Sanitize the template's user information
    const sanitizedUserInfo = await sanitize.sanitizers.defaultSanitizeOutput(userSchema, user);

    const confirmationToken = '' + Math.floor(1000 + Math.random() * 9000);

    //const options = {
    //  host: 'api.telegram.org',
    //  path: '/bot5718683414:AAErHb8uXIopt_BRT43KIb2dICyhU92qdrA/sendMessage?chat_id=@ZHBChnn&text='+ confirmationToken
   // };
    await editme(user.id, { confirmationToken });


    
//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'

    
    const callback = function(response) {
      let str = '';
    console.log(options)
      //another chunk of data has been received, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been received, so we just print it out here
      response.on('end', function () {
        console.log(str);
      });
    }

    //http.request(options, callback).end();

    const apiPrefix = strapi.config.get('api.rest.prefix');
    settings.message = await userPermissionService.template(settings.message, {
      URL: urlJoin(getAbsoluteServerUrl(strapi.config), apiPrefix, '/auth/email-confirmation'),
      SERVER_URL: getAbsoluteServerUrl(strapi.config),
      ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
      USER: sanitizedUserInfo,
      CODE: confirmationToken,
    });

    settings.object = await userPermissionService.template(settings.object, {
      USER: sanitizedUserInfo,
    });
    console.log(settings)
    // Send an email to the user.
    strapi
      .plugin('email')
      .service('email')
      .send({
        to: user.email,
        from: settings.from.email && settings.from.name
            ? `${settings.from.name} <${settings.from.email}>`
            : undefined,
        replyTo: settings.response_email,
        subject: settings.object,
        text: settings.message,
        html: settings.message,
      }).then(res=>{
         console.log(res)
      }).catch(err=>{
         console.log(err);
      });

    }

    const validateSendEmailConfirmationBody = validateYupSchema(yup.object({
         email: yup.string().email().required()
    }));

module.exports = (plugin) => {
  const register = plugin.controllers.auth.register;
  const confirmer = plugin.controllers.auth.emailConfrimation;
  const sendConf = plugin.controllers.auth.sendEmailConfirmation;

  plugin.controllers.auth.sendEmailConfirmation = async (ctx) => {
    const { email } = await validateSendEmailConfirmationBody(ctx.request.body);

    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return ctx.send({ email, sent: true });
    }

    if (user.confirmed) {
      throw new ApplicationError('Already confirmed');
    }

    if (user.blocked) {
      throw new ApplicationError('User blocked');
    }
    await sendConfirmationEmail(user);


    ctx.send({
      email: user.email,
      sent: true,
    });
  }

  plugin.controllers.auth.emailConfirmation = async (ctx, next, returnUser) => {
    console.log("QUERY",ctx.query);
    const { confirmation: confirmationToken,email: email } = ctx.query;
    console.log("TOKEN:",confirmationToken);
    const userService = getService('user');
    const jwtService = getService('jwt');
    console.log("CONFIRMING SHIT!!!");
    const [user] = await userService.fetchAll({filters:{ 'email': email, 'confirmation_token': confirmationToken }});
    console.log(user);
    if (!user) {
      throw new ValidationError('Invalid token');
    }
    
    await userService.edit(user.id, { confirmed: true, confirmationToken: null });

    if (true) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      });
    } else {
      const settings = await strapi
        .store({ type: 'plugin', name: 'users-permissions', key: 'advanced' })
        .get();

       
    }
  }

  plugin.controllers.auth.register = async (ctx) => {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });

    const settings = await pluginStore.get({ key: 'advanced' });

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled');
    }
    console.log("PROVIDER:",ctx.request.body.provider)

    const params = {
      ..._.omit(ctx.request.body, [
        'confirmed',
        'blocked',
        'confirmationToken',
        'resetPasswordToken',
        'provider',
      ]),
      provider: ctx.request.body.provider.trim()  === 'FACEBOOK' ? 'local' : 'local',
      confirmed: ctx.request.body.provider.trim().toLowerCase() !== 'local' ? true : false
    };

    await validateRegisterBody(params);

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError('Impossible to find the default role');
    }

    const { email, username, provider } = params;

    const identifierFilter = {
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() },
        { username },
        { email: username },
      ],
    };

    const conflictingUserCount = await strapi.query('plugin::users-permissions.user').count({
      where: { ...identifierFilter, provider },
    });

    if (conflictingUserCount > 0) {
      throw new ApplicationError('Email or Username are already taken');
    }

    if (settings.unique_email) {
      const conflictingUserCount = await strapi.query('plugin::users-permissions.user').count({
        where: { ...identifierFilter },
      });

      if (conflictingUserCount > 0) {
        throw new ApplicationError('Email or Username are already taken');
      }
    }
    const newUser = {
      ...params,
      role: role.id,
      email: email.toLowerCase(),
      username,
      confirmed: ctx.request.body.provider.toLowerCase() !== 'local' ? true : !settings.email_confirmation,
    };

    console.log('pRARM',newUser)

    const user = await getService('user').add(newUser);

    const sanitizedUser = await sanitizeUser(user, ctx);

    if (settings.email_confirmation && 
                 ctx.request.body.provider.toLowerCase()  === 'local') {
      try {
        await sendConfirmationEmail(sanitizedUser);
      } catch (err) {
        throw new ApplicationError(err.message);
      }
      console.log("SENDING THE SHIT AWAY!!!");
      return ctx.send({ user: sanitizedUser });
    }

    const jwt = getService('jwt').issue(_.pick(user, ['id']));

    return ctx.send({
      jwt,
      user: sanitizedUser,
    });
  };
  return plugin;
};

