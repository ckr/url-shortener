import * as cdk from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { Duration, RemovalPolicy, Stack, CfnOutput } from '@aws-cdk/core';
import {
    CloudFrontWebDistribution,
    SSLMethod,
    SecurityPolicyProtocol,
    OriginProtocolPolicy,
    CloudFrontAllowedMethods,
    CloudFrontAllowedCachedMethods
} from '@aws-cdk/aws-cloudfront';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import {
    RestApi,
    LambdaIntegration,
    PassthroughBehavior
} from '@aws-cdk/aws-apigateway';
import {
    Function as LamdaFunction,
    Runtime as LamdaRuntime,
    Code as LamdaCode
} from '@aws-cdk/aws-lambda';
import { Config } from './config';

export class UrlShortenerStack extends cdk.Stack {
    constructor(id: string, config: Config) {
        super(config.getApp(), id, {
            env: config.getParam('aws_env_details'),
            tags: config.getParam('stack_tags'),
            description: 'Serverless private URL shortener based on Amazon S3, AWS Lambda, Amazon CloudFront and API Gateway.',
        });

        config.urlSuffix = this.urlSuffix;
        config.region = this.region;
        new UrlShortener(this, 'UrlShortener', config);
    }
}

export class UrlShortener extends cdk.Construct {
    private bucket: Bucket;
    private meRedirect: string;

    /**
     * Creates an s3 bucket with default life cycle rules under the u prefix
     * Configures default index.html and error.html
     * Enables public access
     * Destroyes the bucket if the stack is destroyed
     * Adds an admin folder
     * 
     * @param name The name of the bucket in the cloudformation stack
     * @param bucketName The name of the bucket in s3, has to be unique
     */
    createS3Bucket(name: string, bucketName: string) { // Create a bucket to store the short url files
        this.bucket = new Bucket(this, name, {
            bucketName: bucketName,
            removalPolicy: RemovalPolicy.DESTROY,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
            publicReadAccess: true,
            lifecycleRules: [
                {
                    id: 'DisposeShortUrls',
                    prefix: 'u',
                    expiration: Duration.days(7)
                }
            ]
        });
    }

    createPermanentRedirectLink(file: string, redirect: string, distribution: CloudFrontWebDistribution) {
        new BucketDeployment(this, `DeployPLinks-${file}`, {
            sources: [
                Source.asset('./assets/p', {
                    exclude: ['**', `!${file}`]
                })
            ],
            destinationBucket: this.bucket,
            destinationKeyPrefix: 'p',
            contentType: 'text/html',
            websiteRedirectLocation: redirect,
            distribution: distribution,
            distributionPaths: [`/p/${file}`]
        });
    }

    constructor(scope: cdk.Construct, id: string, config: Config) {
        super(scope, id);

        this.createS3Bucket('Bucket', config.zoneName);
        this.meRedirect = config.getStackParam('meRedirect');

        const shortLamda = new LamdaFunction(this, 'ShortnerLamda', {
            runtime: LamdaRuntime.NODEJS_12_X,
            handler: 'index.handler',
            code: LamdaCode.fromAsset('./lambda'),
            environment: {
                'S3_BUCKET': this.bucket.bucketName,
                'S3_PREFIX': 'u',
                'S3_REGION': Stack.of(this).region
            }
        });

        this.bucket.grantDelete(shortLamda);
        this.bucket.grantPut(shortLamda);
        this.bucket.grantRead(shortLamda);

        const api = new RestApi(this, 'ShortnerApi', {
            restApiName: 'Lambda Shortener Service',
            description: 'Rest API for URL Shortener',
        });

        const integration = new LambdaIntegration(shortLamda, {
            proxy: false,
            passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
            integrationResponses: [
                {
                    statusCode: '200',
                }
            ],
        });

        api.root.addMethod('POST', integration, {
            methodResponses: [
                {
                    statusCode: '200'
                }
            ]
        });

        const cloudFront = new CloudFrontWebDistribution(this, 'CloudFront', {
            comment: 'CloudFront distribution used as a front end to the server-less URL Shortener',
            originConfigs: [
                {
                    originPath: '',
                    customOriginSource: {
                        domainName: this.bucket.bucketWebsiteDomainName,
                        originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY
                    },
                    behaviors: [
                        {
                            pathPattern: '/admin/*'
                        },
                        {
                            pathPattern: '/admin'
                        },
                        {
                            pathPattern: '/p/*'
                        },
                        {
                            pathPattern: '/error-pages/*'
                        }, {
                            pathPattern: '/index.html'
                        }, {
                            pathPattern: '/error.html'
                        },
                    ]
                },
                {
                    originPath: '',
                    customOriginSource: {
                        //TODO: This is a hack find a way to fix
                        domainName: `${api.restApiId}.execute-api.${config.region}.${config.urlSuffix}`,
                        originProtocolPolicy: OriginProtocolPolicy.MATCH_VIEWER,
                    },
                    behaviors: [
                        {
                            pathPattern: '/prod/*',
                            allowedMethods: CloudFrontAllowedMethods.ALL,
                            cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,

                        }
                    ]
                },
                {
                    originPath: '/u',
                    customOriginSource: {
                        domainName: this.bucket.bucketWebsiteDomainName,
                        originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true
                        }
                    ]
                },
            ],
            errorConfigurations: [
                {
                    errorCode: 404,
                    responseCode: 404,
                    responsePagePath: '/error-pages/error-404.html'
                }
            ],
            aliasConfiguration: {
                acmCertRef: config.certificate.certificateArn,
                names: [config.zoneName],
                sslMethod: SSLMethod.SNI,
                securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2019
            }
        });

        const bucketDeployRoot = new BucketDeployment(this, 'DeployRootFiles', {
            sources: [
                Source.asset('./assets', {
                    exclude: ['p/**', '.DS_Store']
                }),
            ],
            destinationBucket: this.bucket,
            distribution: cloudFront,
            distributionPaths: ['/*']
        });

        this.createPermanentRedirectLink('me', this.meRedirect, cloudFront);

        const record = new ARecord(this, 'ARecord', {
            recordName: config.zoneName,
            zone: config.zone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFront))
        });

        new CfnOutput(this, 'ShortUrlDns', { value: `https://${record.domainName}` });
    }
}
