import "dotenv/config";
import { Worker } from "bullmq";
import redis from "./utils/redis.js";
import { QdrantClient } from "@qdrant/js-client-rest"
import fs from "fs/promises";
import faceapi from "@vladmandic/face-api"
import canvas from "canvas"

const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk("./lightweight_models"),
    faceapi.nets.faceLandmark68Net.loadFromDisk("./lightweight_models"),
    faceapi.nets.faceRecognitionNet.loadFromDisk("./lightweight_models"),
])

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
})

async function indexFacesInImage(imagePath, photoId) {
    const img = await canvas.loadImage(imagePath)
    const c = canvas.createCanvas(img.width*2, img.height*2)
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, c.width, c.height);

    const detections = await faceapi.detectAllFaces(c, new faceapi.SsdMobilenetv1Options({
        maxResults: 30,
        minConfidence: 0.4
    }))
    .withFaceLandmarks()
    .withFaceDescriptors();

    return detections.map(detection => {
        const { descriptor } = detection;
        return { embeddings: descriptor, photoId };
    })
}

async function processImages(photos, eventId) {
    console.log("Processing Images")

    const results = await Promise.allSettled(photos.map(async (photo) => {
        const res = await fetch(photo.url)
        const blob = await res.blob();

        await fs.mkdir(`images/${eventId}`, { recursive: true });
        const imageName = `images/${eventId}/${photo._id}-${photo.url.split('/').pop()}`;
        await fs.writeFile(imageName, Buffer.from(await blob.arrayBuffer()), "binary");

        const faces = await indexFacesInImage(imageName, photo._id);
        await fs.unlink(imageName);

        return faces;
    }))
    
    const allFaces = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value)

    console.log(allFaces)
}

new Worker("imageQueue", async job => {
    const { photos, eventId } = job.data;
    await processImages(photos, eventId);
}, { connection: redis });
