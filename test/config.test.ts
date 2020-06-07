import { App } from '@aws-cdk/core';
import { Config } from '../lib/config';

describe('config module', function () {
    test('retrieve specific param', () => {
        const app = new App({
            context: {
                key: "value"
            }
        });
        const config = new Config(app);

        expect(config.getParam('key')).toEqual('value');
    });

    test('retrieve stack specific param', () => {
        const app = new App({
            treeMetadata: false
        });

        app.node.setContext("stack_params", {
            zone: "example.com"
        });

        const config = new Config(app);

        expect(config.getParam('stack_params').zone).toEqual('example.com');
    });
});