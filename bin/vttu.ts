#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VttuStack } from '../lib/vttu-stack';

const app = new cdk.App();

new VttuStack(app, 'VttuStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-north-1'
  }
});
