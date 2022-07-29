import { verifyKey } from "discord-interactions";
import { Request, Response } from "@google-cloud/functions-framework/build/src/functions";
import env from "./util/env";

function validate(req: Request, res: Response) {
  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");

  if (!signature) {
    return false;
  }

  if (!timestamp) {
    return false;
  }

  if (!req.rawBody) {
    return res.status(400);
  }

  if (!(signature && timestamp && req.rawBody)) return false;

  return verifyKey(
    req.rawBody,
    signature,
    timestamp,
    env("DISCORD_PUBLIC_KEY"),
  );
}

export function discordDigest(req: Request, res: Response) {
  if (!validate(req, res)) return res.status(401);

  return res.send({
    type: 1,
  });
}
