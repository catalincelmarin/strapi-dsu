FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json ./
#RUN yarn config set fetch-retry-maxtimeout 600000 -g && yarn install
RUN npm install --ignore-scripts=false --foreground-scripts --verbose sharp
RUN npm install --platform=linuxmusl --arch=x64 sharp
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN chown -R node:node /opt/app
USER node
RUN yarn build
EXPOSE 1337
CMD ["npm", "run", "develop"]
#FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
#RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev
#ARG NODE_ENV=development
#ENV NODE_ENV=${NODE_ENV}
#
#WORKDIR /opt/
#COPY package.json ./
#RUN yarn config set fetch-retry-maxtimeout 600000 -g && yarn install
#RUN npm install --ignore-scripts=false --foreground-scripts --verbose sharp
#RUN npm install --platform=linuxmusl --arch=x64 sharp
#ENV PATH /opt/node_modules/.bin:$PATH
#
#WORKDIR /opt/app
#COPY . .
#RUN chown -R node:node /opt/app
#USER node
#RUN yarn build
#EXPOSE 1337
#CMD ["npm", "run", "develop"]

