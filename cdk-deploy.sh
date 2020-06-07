#!/bin/zsh

npm run build
npm run test
cdk deploy '*'