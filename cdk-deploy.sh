#!/bin/zsh

yarn run build
yarn run test
cdk deploy '*'