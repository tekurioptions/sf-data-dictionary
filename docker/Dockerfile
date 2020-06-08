FROM node:lts-alpine

COPY ./client /home/node/client
COPY ./server /home/node/server

RUN cd /home/node/client \
    && npm install \
    && npm run build \
    && cd /home/node/server \
    && rm -rf /home/node/client \
    && npm install

WORKDIR /home/node/server

ENTRYPOINT [ "npm", "run", "start" ]