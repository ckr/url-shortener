#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CkrCyUrlShortenerStack } from '../lib/ckr-cy-url-shortener-stack';

const app = new cdk.App();
new CkrCyUrlShortenerStack(app, 'CkrCyUrlShortenerStack');
