FROM mcr.microsoft.com/devcontainers/javascript-node:18

RUN apt-get update && apt-get install -y locales \
    && locale-gen en_US.UTF-8 \
    && update-locale LANG=en_US.UTF-8

RUN npm install -g pnpm

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
