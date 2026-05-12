import { EC2Client } from "@aws-sdk/client-ec2";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const AWS_REGION = process.env.AWS_REGION || "us-west-2";
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN;

export function createEc2Client() {
  const isVercel = !!process.env.VERCEL;

  return new EC2Client({
    region: AWS_REGION,
    ...(isVercel && AWS_ROLE_ARN
      ? {
          credentials: awsCredentialsProvider({
            roleArn: AWS_ROLE_ARN,
          }),
        }
      : {}),
  });
}