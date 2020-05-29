import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CertificateAttributes, UrlShortenerCertStack } from '../lib/url-shortner-cert-stack';

function getParams(app: cdk.App, keyName: string) {
  return app.node.tryGetContext(keyName);
};

test('Empty Test', () => {
  const app = new cdk.App();
  //WHEN
  const stack = new cdk.Stack(app, 'EmptyStack');
  //THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.EXACT));
});

// test('Empty Stack', () => {
//     const app = new cdk.App();
//     const certAttr = new CertificateAttributes();
//     // WHEN
//     const stack = new UrlShortenerCertStack(app, 'MyTestStack', certAttr, { env: getParams(app, 'stack_params') });
//     // THEN
//     expectCDK(stack).to(matchTemplate({
//       "Resources": {}
//     }, MatchStyle.EXACT))
// });
