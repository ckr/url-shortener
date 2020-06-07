import { Stack, Construct } from '@aws-cdk/core';
import {DnsValidatedCertificate, ValidationMethod } from '@aws-cdk/aws-certificatemanager';
import { HostedZone } from '@aws-cdk/aws-route53';
import { Config } from './config';

export class CertificateManagerStack extends Stack {
    constructor(id: string, config: Config) {
        super(config.getApp(), id, {
            env: config.getParam('aws_env_details'),
            tags: config.getParam('stack_tags'),
            description: 'Certificates for serverless private url shortner'
        });

        new CertificateManager(this, 'CertificateManager', config);
    }
}

export class CertificateManager extends Construct {
    constructor(scope: Construct, id: string, config: Config) {
        super(scope, id);

        config.zoneName = config.getStackParam('dnsZoneName');
        config.subjectAlternativeNames = config.getStackParam('subjectAlternativeNames');

        config.zone = HostedZone.fromLookup(this, 'ZoneCK', { domainName: config.zoneName });

        config.certificate = new DnsValidatedCertificate(this, 'Certificate', {
            domainName: config.zoneName,
            subjectAlternativeNames: config.subjectAlternativeNames,
            hostedZone: config.zone,
            validationMethod: ValidationMethod.DNS,
            region: 'us-east-1' // CloudFront only supports us-east-1 certs from ACM,,,,,,,,,,,
        });
    }
}
