#!/usr/bin/en
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { CertificateManagerStack, } from '../lib/url-shortner-cert-stack';
import { UrlShortenerStack } from '../lib/url-shortener-stack';
import { Config } from '../lib/config';

const app = new App();
const config = new Config(app);

const certificateStack = new CertificateManagerStack('UrlShortenerCertStack', config);
const shortner = new UrlShortenerStack('UrlShortenerStack', config);
shortner.addDependency(certificateStack);
