import * as path from 'path';
import { execSync } from 'child_process';
import { DockerImage, Duration, RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface VttuStackProps extends StackProps {
  hostedZoneId: string;
  certificate: acm.ICertificate;
}

export class VttuStack extends Stack {
  constructor(scope: Construct, id: string, props: VttuStackProps) {
    super(scope, id, props);

    const domainName = 'vttu.fi';
    const subDomain = `www.${domainName}`;

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: domainName
    });

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false
    });

    const table = new dynamodb.Table(this, 'SubmissionsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN
    });

    const handler = new lambda.Function(this, 'SubmissionHandler', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      // Cap concurrency so a flood of requests to the public Function URL cannot
      // run up unbounded Lambda/DynamoDB cost. Note: this throttles abuse, it
      // does not block it — see README for the WAF/CAPTCHA follow-up.
      reservedConcurrentExecutions: 5,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: DockerImage.fromRegistry('public.ecr.aws/docker/library/golang:1.24'),
          local: {
            tryBundle(outputDir: string): boolean {
              execSync('GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap .', {
                cwd: path.join(__dirname, '../lambda'),
                stdio: 'inherit'
              });
              execSync(`cp bootstrap ${outputDir}/bootstrap`, {
                cwd: path.join(__dirname, '../lambda'),
                stdio: 'inherit'
              });
              return true;
            }
          },
          command: [
            'bash',
            '-c',
            'GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -o /asset-output/bootstrap .'
          ]
        }
      }),
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    table.grantWriteData(handler);

    const functionUrl = handler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        // Function URL CORS handles the OPTIONS preflight automatically; only the
        // actual request method (POST) is listed here. OPTIONS is not a valid
        // value for AllowMethods and is rejected at deploy time.
        allowedMethods: [lambda.HttpMethod.POST],
        allowedOrigins: [`https://${domainName}`, `https://${subDomain}`],
        allowedHeaders: ['content-type'],
        maxAge: Duration.hours(1)
      }
    });

    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      domainNames: [domainName, subDomain],
      certificate: props.certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }
      ]
    });

    // The React + Tailwind frontend is built by Vite into web/dist. The form is
    // currently inert (see doc/frontend.md), so no config.js with the Function
    // URL is injected; reintroduce a Source.data('config.js', ...) here when a
    // future version needs to call the Lambda.
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [s3deploy.Source.asset(path.join(__dirname, '../web/dist'))]
    });

    new route53.ARecord(this, 'RootAliasRecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    new route53.AaaaRecord(this, 'RootAliasRecordIpv6', {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    new route53.ARecord(this, 'WwwAliasRecord', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    new route53.AaaaRecord(this, 'WwwAliasRecordIpv6', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    new CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${domainName}`
    });

    new CfnOutput(this, 'LambdaFunctionUrl', {
      value: functionUrl.url
    });
  }
}
