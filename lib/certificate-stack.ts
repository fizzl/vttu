import { Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface CertificateStackProps extends StackProps {
  domainName: string;
  subjectAlternativeNames: string[];
  hostedZoneId: string;
}

/**
 * CloudFront requires its ACM certificate to live in us-east-1, so the
 * certificate is created in its own us-east-1 stack and shared with the main
 * stack via cross-region references.
 */
export class CertificateStack extends Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName
    });

    this.certificate = new acm.Certificate(this, 'WebsiteCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validation: acm.CertificateValidation.fromDns(zone)
    });
  }
}
