# express-docker-reference

Experimental Docker with Express setup

## Setup

Scaffold a skeleton Express app using Express' generator

```
npx express-generator --view=pug express-app
```

Run and test to see if the application is running.

```
cd express-app
npm install
DEBUG=express-app:* npm start
```

Create a docker file for local docker development

- using node:14-alpine as the starting point. We are using alpine because it is a small and secure base image for docker containers.
- We first copy package.json and lock file to the WORKDIR /src to exploit docker’s build caching
- Then we run npm install --production to get only the needed application dependencies from npm
- After that our application code is copied to /src
- Consequently the port is exposed and command to star the server is executed

```docker
FROM node:14-alpine

WORKDIR /src
COPY package.json package-lock.json /src/
RUN npm install --production

COPY . /src

EXPOSE 3000

CMD ["node", "bin/www"]
```
