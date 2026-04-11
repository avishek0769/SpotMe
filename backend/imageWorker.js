import "dotenv/config";
import { Worker } from "bullmq";
import redis from "./utils/redis.js";
import { QdrantClient } from "@qdrant/js-client-rest"
import fs from "fs/promises";
import faceapi from "@vladmandic/face-api"
import canvas from "canvas"
import { v4 as uuidv4 } from 'uuid';

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
    const c = canvas.createCanvas(img.width * 2, img.height * 2)
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
    const dirPath = `images/${eventId}`
    await fs.mkdir(dirPath, { recursive: true });

    try {
        const results = await Promise.allSettled(
            photos.map(async (photo) => {
                const res = await fetch(photo.url)
                const arrayBuffer = await res.arrayBuffer();

                const imageName = `${dirPath}/${photo.url.split("/").pop()}`;
                await fs.writeFile(imageName, Buffer.from(arrayBuffer));

                const faces = await indexFacesInImage(imageName, photo._id);
                await fs.unlink(imageName);

                return faces;
            })
        )

        const allFaces = results
            .filter(r => r.status === "fulfilled" && r.value?.length > 0)
            .flatMap(r => r.value)

        if (allFaces.length === 0) {
            console.log("No faces detected in this batch. Skipping Qdrant upsert.");
            return; 
        }

        await qdrant.upsert(`Event_${eventId}`, {
            wait: true,
            points: allFaces.map(face => ({
                id: uuidv4(),
                vector: Array.from(face.embeddings),
                payload: { photoId: face.photoId }
            }))
        });

        console.log("Finished processing batch of images")
    }
    catch (error) {
        console.error("Error processing images:", error);
    }
    finally {
        await fs.rm(dirPath, { recursive: true });
    }
}

new Worker("imageQueue", async job => {
    const { photos, eventId } = job.data;

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === `Event_${eventId}`);

    if (!exists) {
        await qdrant.createCollection(`Event_${eventId}`, {
            vectors: {
                size: 128,
                distance: "Cosine",
            },
        });
    }

    await processImages(photos, eventId);
}, { connection: redis });
