import { App } from '@aws-cdk/core';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { IHostedZone } from '@aws-cdk/aws-route53';

export class Config {
    private app: App;
    public region: string;
    public urlSuffix: string;
    public zoneName: string;
    public subjectAlternativeNames: string[];
    public zone: IHostedZone;
    public certificate: ICertificate;

    constructor(app: App) {
        this.app = app;
    }
    
    public getApp() {
        return this.app;
    }
    
    public getParam(keyName: string) {
        return this.app.node.tryGetContext(keyName);
    }

    public getStackParam(keyName: string) {
        return this.app.node.tryGetContext('stack_params')[keyName];
    }
}