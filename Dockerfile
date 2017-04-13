FROM resin/raspberrypi3-node

RUN apt-get update && apt-get install -yq libraspberrypi-bin

WORKDIR usr/src/app
COPY . ./

CMD npm start
