import { Stack, Construct, StackProps, } from '@aws-cdk/core';
import { Certificate, ICertificate, DnsValidatedCertificate, ValidationMethod, } from '@aws-cdk/aws-certificatemanager';
import { HostedZone, IHostedZone, } from '@aws-cdk/aws-route53';

export class CertificateAttributes {
    zoneName: string;
    subjectAlternativeNames: string[];
    zone: IHostedZone;
    certificate: ICertificate;
}

export class UrlShortenerCertStack extends Stack {
    private certAttr: CertificateAttributes;

    getStackStringParam(key: string): string {
        return this.node.tryGetContext('stack_params')[key];
    }

    getStackListParam(key: string): string[] {
        return this.node.tryGetContext('stack_params')[key] || [];
    }

    constructor(scope: Construct, id: string, certAttr: CertificateAttributes, props?: StackProps) {
        super(scope, id, props);
        this.certAttr = certAttr;

        this.certAttr.zoneName = this.getStackStringParam('dnsZoneName');
        this.certAttr.subjectAlternativeNames = this.getStackListParam('subjectAlternativeNames');

        this.certAttr.zone = HostedZone.fromLookup(this, 'ZoneCK', { domainName: this.certAttr.zoneName });

        this.certAttr.certificate = new DnsValidatedCertificate(this, 'Certificate', {
            domainName: this.certAttr.zoneName,
            subjectAlternativeNames: this.certAttr.subjectAlternativeNames,
            hostedZone: this.certAttr.zone,
            validationMethod: ValidationMethod.DNS,
            region: 'us-east-1' // CloudFront only supports us-east-1 certs from ACM,,,,,,,,,,,
        });
    }
}
