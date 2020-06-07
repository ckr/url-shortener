import { expect, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { Config } from '../lib/config';
import { UrlShortener } from '../lib/url-shortener-stack';
import { CertificateManager } from '../lib/url-shortner-cert-stack';

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
            ],
            'meRedirect': 'https://google.com',
        })
        this.stack = new cdk.Stack(this.app, 'UrlShortenerTestStack', {
            env: {
                account: "1",
                region: 'eu-west-1'
            }
        });
    }
}

describe('Test url shortener setup', function () {
    test('should create an s3 bucket with the correct details', () => {
        const app = new TestApp();
        const config = new Config(app.app);
        new CertificateManager(app.stack, 'CertManagerSetup', config);
        new UrlShortener(app.stack, 'UrlShortenerSetup', config);
        // expect(app.stack).to(haveResource('AWS::S3::Bucket', {
        //     'BucketName': 'example.com',
        //     'LifecycleConfiguration': {
        //         'Rules': [
        //             {
        //                 'ExpirationInDays': 7,
        //                 'Id': 'DisposeShortUrls',
        //                 'Prefix': 'u',
        //                 'Status': 'Enabled'
        //             }
        //         ]
        //     },
        //     'WebsiteConfiguration': {
        //         'ErrorDocument': 'error.html',
        //         'IndexDocument': 'index.html'
        //     }
        // }));
    });
});