# drl tools server module

Socket server that accepts audio streams and transcribes them. Can only handle 16bit little endian encoded audio streams.

## Deployment

### with docker

* copy google application credentials file into server root and name it *google-credentials.json*.
* build docker image with `docker-compose build`
* run docker container in detached mode `docker-compose up -d`
* you can enter the docker container with `docker exec -it tools-server /bin/sh`