import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CkrCyUrlShortenerStack } from '../lib/ckr-cy-url-shortener-stack';
import { CertificateAttributes } from '../lib/url-shortner-cert-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    const certAttr = new CertificateAttributes();
    // WHEN
    const stack = new CkrCyUrlShortenerStack(app, 'MyTestStack', certAttr);
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
