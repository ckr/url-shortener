import { Stack, App } from '@aws-cdk/core';
import { SynthUtils } from '@aws-cdk/assert';
import { Config } from '../lib/config';
import { UrlShortener } from '../lib/url-shortener-stack';
import { CertificateManager } from '../lib/url-shortner-cert-stack';

class TestApp {
    public readonly stack: Stack;
    public readonly app: App;

    constructor() {
        this.app = new App({
            treeMetadata: false
        });
        this.app.node.setContext('stack_params', {
            'dnsZoneName': 'example.com',
            'subjectAlternativeNames': [
                '*.example.com'
            ],
            'meRedirect': 'https://google.com',
        })
        this.stack = new Stack(this.app, 'UrlShortenerTestStack', {
            env: {
                account: "1",
                region: 'eu-west-1'
            }
        });
    }
}

describe('Test url shortener setup', function () {
    test('should create a Url Shortner Stack based on the snap shot taken', () => {
        const app = new TestApp();
        const config = new Config(app.app);
        new CertificateManager(app.stack, 'CertManagerSetup', config);
        new UrlShortener(app.stack, 'UrlShortenerSetup', config);
        expect(SynthUtils.toCloudFormation(app.stack)).toMatchSnapshot();
    });
});