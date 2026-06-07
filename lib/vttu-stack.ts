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
import * as ssm from 'aws-cdk-lib/aws-ssm';
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
      // Hard ceiling on on-demand throughput so an unattended flood cannot run up
      // an unbounded bill. Above these, DynamoDB throttles (the PutItem fails)
      // rather than billing the spike. Far above real traffic (a few writes/day),
      // low enough to bound a worst-case month to a few tens of dollars. Note the
      // per-IP rate-limit counter means each valid submission costs two writes.
      maxWriteRequestUnits: 10,
      maxReadRequestUnits: 10,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // Per-IP rate-limit counters (see lambda/main.go) set this attribute so
      // DynamoDB expires them automatically. Submissions never set it, so they
      // are never reaped.
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: RemovalPolicy.RETAIN
    });

    // ALTCHA HMAC signing key (Tier 1A in doc/lambda.md). Stored as
    // a free SSM SecureString that CDK only references, never creates: CDK cannot
    // generate a SecureString value, so it is provisioned once out of band (see
    // doc/lambda.md for the one-liner). The Lambda reads it once at
    // cold start and caches it.
    const altchaSecretParameterName = '/vttu/altcha-hmac-secret';
    const altchaSecret = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'AltchaSecret', {
      parameterName: altchaSecretParameterName
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
        TABLE_NAME: table.tableName,
        // Tier 0 Origin check in the handler. Mirrors the Function URL CORS
        // allowlist so the handler also rejects scripts that omit/spoof Origin.
        ALLOWED_ORIGINS: [`https://${domainName}`, `https://${subDomain}`].join(','),
        // Tier 1A: SSM parameter holding the ALTCHA HMAC key. Read once at cold
        // start (see lambda/main.go); unset means ALTCHA is disabled.
        ALTCHA_SECRET_PARAM: altchaSecretParameterName
      }
    });

    table.grantWriteData(handler);
    // Read access to the ALTCHA secret. For a SecureString on the default
    // aws/ssm KMS key, the key policy already grants decrypt to in-account
    // callers via SSM, so ssm:GetParameter is sufficient — no extra KMS grant.
    altchaSecret.grantRead(handler);

    const functionUrl = handler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        // Function URL CORS handles the OPTIONS preflight automatically; only the
        // actual request methods are listed here. GET serves the ALTCHA challenge
        // to the widget; POST submits the form. OPTIONS is not a valid value for
        // AllowMethods and is rejected at deploy time.
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
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

    // The React + Tailwind frontend is built by Vite into web/dist. The form
    // reads the Lambda Function URL at runtime from window.__VTTU_CONFIG__ (set
    // by config.js), so the frontend needs no build-time configuration. We
    // generate config.js here with the live Function URL and list it AFTER the
    // built assets so it overwrites the empty web/public/config.js placeholder.
    const runtimeConfig = s3deploy.Source.data(
      'config.js',
      `window.__VTTU_CONFIG__ = { submitUrl: ${JSON.stringify(functionUrl.url)} };\n`
    );

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [s3deploy.Source.asset(path.join(__dirname, '../web/dist')), runtimeConfig]
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
