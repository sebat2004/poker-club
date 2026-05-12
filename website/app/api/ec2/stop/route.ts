import { NextResponse } from "next/server";
import {
  DescribeInstancesCommand,
  EC2Client,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

export const runtime = "nodejs";

const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

export const ec2 = new EC2Client({
  region: AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
});

async function getInstanceState(instanceId: string) {
  const result = await ec2.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    })
  );

  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name ?? "unknown";
}

async function stopInstance(instanceId: string) {
  await ec2.send(
    new StopInstancesCommand({
      InstanceIds: [instanceId],
    })
  );
}

export async function POST() {
  const instanceId = process.env.NEKO_INSTANCE_ID;

  if (!instanceId) {
    return NextResponse.json(
      { error: "Missing NEKO_INSTANCE_ID" },
      { status: 500 }
    );
  }

  try {
    const state = await getInstanceState(instanceId);

    if (state === "stopped") {
      return NextResponse.json({
        ok: true,
        message: "Instance is already stopped",
        state,
      });
    }

    if (state === "stopping") {
      return NextResponse.json({
        ok: true,
        message: "Instance is already stopping",
        state,
      });
    }

    if (state !== "running") {
      return NextResponse.json(
        {
          ok: false,
          error: `Instance is not running. Current state: ${state}`,
          state,
        },
        { status: 400 }
      );
    }

    await stopInstance(instanceId);

    return NextResponse.json({
      ok: true,
      message: "Stop request sent",
      previousState: state,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not stop EC2 instance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}