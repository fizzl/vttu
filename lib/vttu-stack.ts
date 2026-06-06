import * as path from 'path';
import { execSync } from 'child_process';
import { Duration, RemovalPolicy, Stack, StackProps, CfnOutput, CfnParameter } from 'aws-cdk-lib';
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

export class VttuStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domainName = 'vttu.fi';
    const subDomain = `www.${domainName}`;

    const hostedZoneId = new CfnParameter(this, 'HostedZoneId', {
      type: 'String',
      description: 'Route53 hosted zone ID for vttu.fi'
    });

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: hostedZoneId.valueAsString,
      zoneName: domainName
    });

    const certificate = new acm.DnsValidatedCertificate(this, 'WebsiteCertificate', {
      domainName,
      hostedZone: zone,
      region: 'us-east-1',
      subjectAlternativeNames: [subDomain]
    });

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebsiteOAI');
    websiteBucket.grantRead(originAccessIdentity);

    const table = new dynamodb.Table(this, 'SubmissionsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN
    });

    const handler = new lambda.Function(this, 'SubmissionHandler', {
      runtime: lambda.Runtime.GO_1_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'main',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          local: {
            tryBundle(outputDir: string): boolean {
              execSync('GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o main .', {
                cwd: path.join(__dirname, '../lambda'),
                stdio: 'inherit'
              });
              execSync(`cp main ${outputDir}/main`, {
                cwd: path.join(__dirname, '../lambda'),
                stdio: 'inherit'
              });
              return true;
            }
          },
          command: [
            'bash',
            '-c',
            'GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o /asset-output/main .'
          ]
        }
      }),
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
        ALLOWED_ORIGINS: `https://${domainName},https://${subDomain}`
      }
    });

    table.grantWriteData(handler);

    const functionUrl = handler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
        allowedOrigins: [`https://${domainName}`, `https://${subDomain}`],
        allowedHeaders: ['content-type'],
        maxAge: Duration.hours(1)
      }
    });

    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      domainNames: [domainName, subDomain],
      certificate,
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

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../web/public')),
        s3deploy.Source.data(
          'config.js',
          `window.VTTU_CONFIG = { apiUrl: "${functionUrl.url}" };`
        )
      ]
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
