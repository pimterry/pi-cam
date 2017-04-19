FROM resin/raspberrypi3-node

WORKDIR usr/src/app

COPY package.json ./
RUN JOBS=MAX npm i --production

COPY index.js ./

CMD npm start
