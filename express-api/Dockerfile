FROM node:14-alpine as base

WORKDIR /src
COPY package.json yarn.lock /src/
EXPOSE 5000

FROM base as production
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile
COPY . /src
CMD ["node"]

FROM base as development
ENV NODE_ENV=development
RUN yarn add nodemon && yarn install
COPY . /src
CMD ["nodemon"]