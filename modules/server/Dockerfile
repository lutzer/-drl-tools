FROM mhart/alpine-node:15

# install required packages
# -

WORKDIR /usr/src/server

# copy credentials
COPY google-credentials.json .

# copy build files
COPY package*.json ./
COPY tsconfig.json .
COPY index.js .
COPY src/* src/

# install dependencies
RUN npm install

# run build commands
RUN npm run build

# expose app & admin editor
EXPOSE 3000
WORKDIR /usr/src/server

# start server
CMD ["npm", "start"]