import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadRouter = createTRPCRouter({
  generateAvatarUploadUrl: publicProcedure
    .input(
      z.object({
        fileType: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { fileType, fileSize } = input;

      if (fileSize > 4 * 1024 * 1024) { // 4MB
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "File size cannot exceed 4MB.",
        });
      }

      const id = randomUUID();
      const key = `avatars/${id}`;

      const putCommand = new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: fileType,
        ContentLength: fileSize,
      });

      const presignedUrl = await getSignedUrl(s3Client, putCommand, {
        expiresIn: 600, // 10 minutes
      });

      const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

      return {
        presignedUrl,
        publicUrl,
      };
    }),
});