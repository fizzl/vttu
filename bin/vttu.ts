#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CertificateStack } from '../lib/certificate-stack';
import { VttuStack } from '../lib/vttu-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'eu-north-1';

const hostedZoneId = app.node.tryGetContext('hostedZoneId') ?? process.env.HOSTED_ZONE_ID;
if (!hostedZoneId) {
  throw new Error('hostedZoneId is required (pass with -c hostedZoneId=... or set HOSTED_ZONE_ID).');
}

const domainName = 'vttu.fi';

// The certificate must live in us-east-1 for CloudFront; it is shared with the
// main stack via cross-region references.
const certificateStack = new CertificateStack(app, 'VttuCertificateStack', {
  env: { account, region: 'us-east-1' },
  crossRegionReferences: true,
  domainName,
  subjectAlternativeNames: [`www.${domainName}`],
  hostedZoneId
});

new VttuStack(app, 'VttuStack', {
  env: { account, region },
  crossRegionReferences: true,
  hostedZoneId,
  certificate: certificateStack.certificate
});
