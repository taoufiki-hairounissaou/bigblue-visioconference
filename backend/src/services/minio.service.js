const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9002, // le port qu'on avait mappé pour Minio (voir infra/docker-compose.yml)
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD
});

const BUCKET = 'recordings';

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false);
  if (!exists) await minioClient.makeBucket(BUCKET);
}

async function uploadRecording(objectName, buffer) {
  await ensureBucket();
  await minioClient.putObject(BUCKET, objectName, buffer);
  return objectName;
}

module.exports = { uploadRecording, BUCKET, minioClient };
