#!/usr/bin/en
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { CertificateAttributes, UrlShortenerCertStack, } from '../lib/url-shortner-cert-stack';
import { UrlShortenerStack } from '../lib/url-shortener-stack';

const app = new App();

function getParams(keyName: string) {
    return app.node.tryGetContext(keyName);
};

const certificateAttr = new CertificateAttributes();

const cert = new UrlShortenerCertStack(app, 'UrlShortenerCertStack', certificateAttr, {
    env: getParams('aws_env_details'),
    tags: getParams('stack_tags'),
    description: 'Certificates for serverless private url shortner',
});

const shortner = new UrlShortenerStack(app, 'UrlShortenerStack', certificateAttr, {
    env: getParams('aws_env_details'),
    tags: getParams('stack_tags'),
    description: 'Serverless private URL shortener based on Amazon S3, AWS Lambda, Amazon CloudFront and API Gateway.',
});
shortner.addDependency(cert);
