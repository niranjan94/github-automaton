#!/usr/bin/env bash

docker build --no-cache -t niranjan94/github-automaton:$TRAVIS_COMMIT .
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
docker tag niranjan94/github-automaton:$TRAVIS_COMMIT niranjan94/github-automaton:latest
docker push niranjan94/github-automaton