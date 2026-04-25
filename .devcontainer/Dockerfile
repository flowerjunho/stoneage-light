FROM mcr.microsoft.com/devcontainers/javascript-node:18

RUN apt-get update && apt-get install -y locales \
    && locale-gen en_US.UTF-8 \
    && update-locale LANG=en_US.UTF-8

RUN npm install -g pnpm

RUN echo 'export PROMPT_COMMAND="PS1=\"\u@\h:\w\\$ \""' >> /etc/profile.d/custom-prompt.sh \
    && chmod +x /etc/profile.d/custom-prompt.sh

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
