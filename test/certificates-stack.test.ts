import { expect, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CertificateManager } from '../lib/url-shortner-cert-stack';
import { Config } from '../lib/config';

class TestApp {
    public readonly stack: cdk.Stack;
    public readonly app: cdk.App;

    constructor() {
        this.app = new cdk.App({
            treeMetadata: false
        });
        this.app.node.setContext('stack_params', {
            'dnsZoneName': 'example.com',
            'subjectAlternativeNames': [
                '*.example.com'
            ]
        })
        this.stack = new cdk.Stack(this.app, 'CertificateManagerTestStack', {
            env: {
                account: "1",
                region: 'eu-west-1'
            }
        });
    }
}

describe('Test certificate manager setup', function () {
    test('should create custom resource with correct domain, alternative names and region', () => {
        const app = new TestApp();
        const config = new Config(app.app);
        new CertificateManager(app.stack, 'CertManagerSetup', config);
        expect(app.stack).to(haveResource('AWS::CloudFormation::CustomResource', {
            "DomainName": 'example.com',
            "SubjectAlternativeNames": [
                "*.example.com"
            ],
            "Region": "us-east-1"
        }));
    })
});
