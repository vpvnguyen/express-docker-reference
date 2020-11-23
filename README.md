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

## Simple docker file for local environment

Create a docker file for local docker development

- using node:14-alpine as the starting point. We are using alpine because it is a small and secure base image for docker containers.
- We first copy package.json and lock file to the WORKDIR /src to exploit docker’s build caching
- Then we run npm install --production to get only the needed application dependencies from npm
- After that our application code is copied to /src
- Consequently the port is exposed and command to star the server is executed

```docker
# ./Dockerfile

FROM node:14-alpine

WORKDIR /src
COPY package.json package-lock.json /src/
RUN npm install --production

COPY . /src

EXPOSE 3000

CMD ["node", "bin/www"]
```

To build the dockerfile to a Node.js docker image execute the following:

```
DOCKER_BUILDKIT=1 docker build -t nodejs-express-docker .
```

Time to run the docker image and see the output for Node.js with Docker on the browser. To do this run the following command:

```
docker run --rm --name nodejs_express -d -p 3000:3000 nodejs-express-docker
```

This command will:

- `--rm` is used to remove the container when it is stopped
- `--name` is used to name the container running Node.js on docker, it will be used later to see logs and stop the container
- `-d` is used to detach the container process sending it in the background
- `-p 3000:3000` means the local post 3000 is mapped to container port 3000

See if the container is running:

```
docker ps
```

You should see an output of the container running:

| CONTAINER ID | IMAGE                 | COMMAND                | CREATED        | STATUS       | PORTS                  | NAMES          |
| ------------ | --------------------- | ---------------------- | -------------- | ------------ | ---------------------- | -------------- |
| 6f82face2129 | nodejs-express-docker | "docker-entrypoint.s…" | 10 seconds ago | Up 9 seconds | 0.0.0.0:3000->3000/tcp | nodejs_express |

View logs from the container

```
docker logs -f nodejs_express
```

Output log from container

```
docker logs <image> >> <log_name>.log
```

Stop container

```
docker stop nodejs_express
```

## Multi-stage docker file to support docker in production

- Base: This stage will have things common for docker with Node.js
- Production: This stage will have components useful for production environment for Node.js on docker. It also uses npm ci in place of npm install.
- Dev: This stage will have nodemon which is only useful for developing Node.js on docker

```
# ./Dockerfile

FROM node:14-alpine as base

WORKDIR /src
COPY package.json package-lock.json /src/
EXPOSE 3000

FROM base as production
ENV NODE_ENV=production
RUN npm ci
COPY . /src
CMD ["node", "bin/www"]

FROM base as dev
ENV NODE_ENV=development
RUN npm install -g nodemon && npm install
COPY . /src
CMD ["nodemon", "bin/www"]

```

build the above Node.js dockerfile to run Node.js on docker with the following command:

```
DOCKER_BUILDKIT=1 docker build --target=dev -t nodejs-express-docker-multi-stage .
```

> Difference: `docker build` command compared to the above one is the inclusion of `--target=dev`. It tells docker to build the `dev` stage not `production`. If you want to build this multi-stage docker file for Node.js on docker use `--target=production` and it will create a docker image optimized for production.

To run the Node.js docker image and attach to its logs, run:

```
docker run --rm --name nodejs_express_ms -d -p 3000:3000 -v "$(pwd)":/src nodejs-express-docker-multi-stage && docker logs -f nodejs_express_ms
```

> Difference: `-v "$(pwd)":/src`
> The server will restart on every file change the current directory is mounted on the docker container’s work dir

## Docker with docker-compose

So far we had to run long commands like below:

```
docker run --rm --name nodejs_express_ms -d -p 3000:3000 -v "$(pwd)":/src nodejs-express-docker-multi-stage
```

Stopping the running contianer also needed another `docker stop` command. The solution to these issue is using docker-compose with Node.js on docker. Docker compose can be used effectively to sew up multiple services like a database with the applicaiton Node.js docker container.

With docker-compose you can get the application running with just as single commands, `docker compose up`. It will build the containers if they are not built and run them for you.

Create a `docker-compose.yml` file to run using `docker-compose`

```yml
version: "3.8"
services:
  web:
    build:
      context: ./
      target: dev
    volumes:
      - .:/src
    command: npm start
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: dev
```

- The version is latest at `3.8`
- In services, the web service has `target:dev` being sent so that we build only for the dev stage not production
- The current directory `.` is mounted to the docker container at `/src` so the changes will be reflected in the container too.
- We changed the `npm start` command in the Docker with Node.js to use `nodemon` as we wil use docker compose only for development.
- We pass in only one environment variable `NODE_ENV` as `dev` other environment variables for instance database credentials can also be passed in as environment variables.

We can use `BUILDKIT` to build docker containers with `docker-compose`:

```
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose build
```

After the containers are built it can be easily ran with `docker-compose up`
