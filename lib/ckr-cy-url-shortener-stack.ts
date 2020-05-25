import * as cdk from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { Duration, RemovalPolicy, Stack } from '@aws-cdk/core';
import {
    CloudFrontWebDistribution,
    SSLMethod,
    SecurityPolicyProtocol,
    OriginProtocolPolicy
} from '@aws-cdk/aws-cloudfront';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { CertificateAttributes } from './url-shortner-cert-stack';
import { LambdaRestApi } from '@aws-cdk/aws-apigateway';
import {
    Function as LamdaFunction,
    Runtime as LamdaRuntime,
    Code as LamdaCode
} from '@aws-cdk/aws-lambda';

export class CkrCyUrlShortenerStack extends cdk.Stack {
    private certAttr: CertificateAttributes;
    private bucket: Bucket;
    readonly meRedirect = 'https://kouloumbris.com';

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

    getStackStringParam(key: string): string {
        return this.node.tryGetContext('stack_params')[key];
    }

    constructor(scope: cdk.Construct, id: string, certAttr: CertificateAttributes, props?: cdk.StackProps) {
        super(scope, id, props);
        this.certAttr = certAttr;

        this.createS3Bucket('Bucket', this.certAttr.zoneName);

        // const shortLamda = new LamdaFunction(this, 'ShortnerLamda', {
        //     runtime: LamdaRuntime.NODEJS_12_X,
        //     handler: 'index.handler',
        //     code: LamdaCode.fromAsset('./lambda'),
        //     environment: {
        //         'S3_BUCKET': this.bucket.bucketName,
        //         'S3_PREFIX': 'u',
        //         'S3_REGION': Stack.of(this).region
        //     }
        // });

        // const api = new LambdaRestApi(this, 'ShortnerApi', {
        //     restApiName: 'Lambda Shortener Service',
        //     description: 'Rest API for URL Shortener',
        //     handler: shortLamda,
        //     proxy: false
        // });

        // const items = api.root.addResource('prod');
        // items.addMethod('POST');

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
                // {
                //     originPath: '/prod',
                //     customOriginSource: {
                //         domainName: api.root.
                //         originProtocolPolicy: OriginProtocolPolicy.MATCH_VIEWER
                //     },
                //     behaviors: [
                //         {
                //             pathPattern: '/prod/*'
                //         }
                //     ]
                // },
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
                acmCertRef: this.certAttr.certificate.certificateArn,
                names: [this.certAttr.zoneName],
                sslMethod: SSLMethod.SNI,
                securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018
            }
        });

        const bucketDeployRoot = new BucketDeployment(this, 'DeployRootFiles', {
            sources: [
                Source.asset('./assets', {
                    exclude: ['./p/**', '.DS_Store']
                }),
            ],
            destinationBucket: this.bucket,
            distribution: cloudFront,
            distributionPaths: ['/*']
        });

        const bucketDeployPLinks = new BucketDeployment(this, 'DeployPLinks', {
            sources: [
                Source.asset('./assets/p', {
                    exclude: ['.DS_Store'] 
                })
            ],
            destinationBucket: this.bucket,
            destinationKeyPrefix: 'p',
            contentType: 'text/html',
            websiteRedirectLocation: this.meRedirect,
            distribution: cloudFront,
            distributionPaths: ['/p/*']
        });

        const record = new ARecord(this, 'ARecord', {
            recordName: this.certAttr.zoneName,
            zone: this.certAttr.zone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFront))
        });
    }
}
