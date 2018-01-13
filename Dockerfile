FROM node:8-alpine

ENV INSTALL_PATH /automaton
RUN mkdir -p $INSTALL_PATH
WORKDIR $INSTALL_PATH

COPY . .

RUN yarn install && yarn build

EXPOSE 3000

CMD yarn start