# Welcome to URL Shortener.

This builds a custom serverless private URL shortener based on Amazon S3, AWS Lambda, Amazon CloudFront and API Gateway.

The `cdk.json` file tells the CDK Toolkit how to execute the app.

## Update the following in `ckd.json`

```
"aws_env_details": {
    "account": "<Your aws account number>",
    "region": "<region you want to deploy>"
},
"stack_params": {
    "dnsZoneName": "<domain name>",
    "subjectAlternativeNames": [
        "*.<domain name>"
    ],
    "meRedirect": "<permanent redirect url>",
}
```

## Useful commands

 * `npm run build`      compile typescript to js
 * `npm run watch`      watch for changes and compile
 * `npm run test`       perform the jest unit tests
 * `./cdk-deploy.sh`    deploy this stack to your default AWS account/region
 * `./cdk-test.sh`      compare deployed stack with current state
 * `./cdk-synth.sh`     emits the synthesized CloudFormation template
