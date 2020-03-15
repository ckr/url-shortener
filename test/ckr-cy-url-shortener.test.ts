import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import CkrCyUrlShortener = require('../lib/ckr-cy-url-shortener-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CkrCyUrlShortener.CkrCyUrlShortenerStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
