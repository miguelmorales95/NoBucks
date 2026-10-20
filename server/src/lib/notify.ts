import { prisma } from "../db";
import { env } from "../env";

/**
 * Create an in-app notification and (if configured) fan it out to the user's
 * registered devices via Amazon SNS. The SNS publish is best-effort and never
 * blocks the request.
 */
export async function notifyUser(
  userId: string,
  n: { icon?: string; title: string; body: string }
) {
  await prisma.notification.create({
    data: { userId, icon: n.icon ?? "🔔", title: n.title, body: n.body },
  });
  if (!env.snsPlatformAppArn) return;
  try {
    const devices = await prisma.device.findMany({ where: { userId, snsArn: { not: null } } });
    if (!devices.length) return;
    const { SNSClient, PublishCommand } = await import("@aws-sdk/client-sns");
    const sns = new SNSClient({ region: env.awsRegion });
    await Promise.all(
      devices.map((d) =>
        sns.send(
          new PublishCommand({
            TargetArn: d.snsArn!,
            Message: JSON.stringify({ default: `${n.title}: ${n.body}` }),
            MessageStructure: "json",
          })
        )
      )
    );
  } catch (err) {
    console.error("SNS publish failed", err);
  }
}
