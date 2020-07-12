import { Stack, App } from '@aws-cdk/core';
import { SynthUtils } from '@aws-cdk/assert';
import { CertificateManager } from '../lib/url-shortner-cert-stack';
import { Config } from '../lib/config';

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
            ]
        })
        this.stack = new Stack(this.app, 'CertificateManagerTestStack', {
            env: {
                account: "1",
                region: 'eu-west-1'
            }
        });
    }
}

describe('Test certificate manager setup', function () {
    test('should create a Certificate Manager Stack based on the saved snapshot', () => {
        const app = new TestApp();
        const config = new Config(app.app);
        new CertificateManager(app.stack, 'CertManagerSetup', config);
        expect(SynthUtils.toCloudFormation(app.stack)).toMatchSnapshot();
    })
});
