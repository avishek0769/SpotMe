<!-- # [Project Banner Placeholder] -->

# SpotMe

Face recognition platform for event photography that helps guests instantly find their photos.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Core Entities](#core-entities)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How Face Recognition Works](#how-face-recognition-works)
- [API Overview](#api-overview)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

SpotMe is a web application built for event photography workflows.

Photographers upload full event albums. Guests open a shared event link, upload a selfie, and SpotMe runs face recognition to return only their matched photos from the entire event collection. Guests can download results, and photographers can manually manage guest collections when needed.

## Features

- Event creation and management for photographers
- High-volume photo ingestion (hundreds to thousands of images per event)
- Direct browser-to-S3 uploads using signed URLs
- Batched uploads in groups of 5 for stable throughput
- Background face indexing with BullMQ + Redis workers
- 128-dimensional face embeddings stored for similarity search in qdrant
- Event access levels:
	- Spot Only: guests can only find their own photos
	- Browse and Spot: guests can browse all event photos and find their own
- Guest flow without mandatory signup
- Optional authenticated guest flow with persistent saved collections
- Cosine similarity matching in qdrant with configurable threshold
- Photographer tools to manually add/remove photos in guest collections
- Privacy by design: photographers cannot view guest-uploaded selfies
- Download capabilities for matched collections (zip) and selective downloads
- Event expiry lifecycle support

## Tech Stack

- Frontend: React, React Router
- Backend: Node.js, Express.js
- Database: MongoDB
- Vector DB: Qdrant
- Face Recognition: face-api.js (TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet)
- File Storage: AWS S3
- Background Jobs: BullMQ + Redis
- Authentication: JWT

## Core Entities

- User (photographer)
- Event
- Photo
- FaceEmbedding
- GuestSession
- GuestCollection

## System Architecture

### Upload and Indexing Flow

1. Photographer creates an event.
2. Frontend requests signed upload URLs from backend.
3. Frontend uploads photos directly to S3 in batches of 5.
4. Backend enqueues indexing jobs in BullMQ.
5. Worker loads each image, extracts face embeddings, and stores vectors in qdrant.
6. Event is marked ready when indexing completes.

### Guest Matching Flow

1. Guest opens shared event link.
2. Guest uploads selfie (anonymous or authenticated flow).
3. Backend extracts face embeddings from selfie.
4. Embeddings are searched in qdrant using cosine similarity.
5. Matched photo IDs are resolved to event photos.
6. Guest sees matched photos and can download results.

### ASCII Overview

```text
Photographer UI
	 |
	 | (signed URL request)
	 v
Backend API --------------------> AWS S3 (event images)
	 |                                  |
	 | (enqueue jobs)                   |
	 v                                  |
BullMQ Worker ---- face-api.js ----> qdrant (128-d vectors)

Guest UI (shared link)
	 |
	 | (selfie upload + match request)
	 v
Backend API ---- face embeddings ----> qdrant similarity search
	 |
	 | (matched photo metadata)
	 v
Guest matched gallery + download
```

## Project Structure

Standard monorepo layout (example):

```text
spotme/
	client/                 # React app (UI, routing, API client)
		src/
			components/
			pages/
			context/
			api/
	server/                 # Node/Express API + workers
		src/
			controllers/
			routers/
			middlewares/
			models/
			workers/
			utils/
	README.md
```

## Getting Started

### Prerequisites

- Node.js
- Package manager (pnpm or npm)
- MongoDB
- Redis
- Qdrant instance
- AWS account with S3 bucket access

### Clone

```bash
git clone https://github.com/avishek0769/SpotMe
cd SpotMe
```

### Install Dependencies

```bash
# monorepo root
pnpm install

# install backend dependencies
cd backend
pnpm install

# complete native TensorFlow/canvas setup required for face pipeline
chmod +x setup.sh
./setup.sh
```

### Run in Development

```bash
# from project root (if workspace scripts are configured)
pnpm dev

# or run apps separately
cd server && pnpm dev
cd client && pnpm dev
```

## How Face Recognition Works

SpotMe uses a four-stage pipeline:

1. Face detection: `TinyFaceDetector` locates faces in each image.
2. Landmark extraction: `FaceLandmark68Net` identifies key facial geometry points.
3. Descriptor generation: `FaceRecognitionNet` creates a 128-dimensional embedding vector per detected face.
4. Vector matching: embeddings are searched in qdrant with cosine similarity and filtered by threshold.

In practice, event photos are indexed in the background, while guest selfies are processed on demand and compared against pre-indexed vectors.

## API Overview

Base route groups used by the backend:

- /user
- /event
- /photo
- /collection

Auth legend:

- Public: no auth middleware
- JWT: requires authenticated user

### /user

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /user/send-verification-code | Public | Send email verification code |
| POST | /user/verify-email | Public | Verify email with code |
| POST | /user/register | Public | Create photographer/user account |
| POST | /user/login | Public | Login and issue auth session/tokens |
| GET | /user/logout | JWT | Logout current user |
| PATCH | /user/refresh-auth-tokens | Public | Refresh expired auth tokens |
| GET | /user/current | JWT | Get currently authenticated user profile |
| POST | /user/send-reset-code | Public | Send password reset code |
| PATCH | /user/reset-password | Public | Reset password using reset code |

### /event

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /event/create | JWT | Create a new event |
| GET | /event/created/list | JWT | List events created by photographer |
| GET | /event/shared/list | JWT | List events shared with current user |
| GET | /event/details/:eventId | Public | Get event metadata by event id |
| GET | /event/all-photos/:eventId | JWT | Get paginated event photos |
| GET | /event/all-guests/:eventId | JWT | List guest access/activity for an event |
| PATCH | /event/edit/:eventId | JWT | Update event fields (name/date/access/cover) |
| PATCH | /event/complete/:eventId | JWT | Mark upload/indexing completion state |
| DELETE | /event/delete/:eventId | JWT | Delete event and related resources |
| POST | /event/enqueue-batch/:eventId | JWT | Enqueue uploaded photo URLs for indexing |

### /photo

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | /photo/signed-url/event/:eventId | JWT | Get S3 presigned POST data for event photo upload |
| GET | /photo/signed-url/selfie | JWT | Get signed URLs for authenticated selfie upload |
| POST | /photo/create/selfie/:eventId | JWT | Persist uploaded selfie URLs into DB collection |
| POST | /photo/upload/selfie-temp | Public | Upload up to 3 temporary selfies for unauth matching |
| POST | /photo/download/selected/:eventId | JWT | Download selected event photos as zip |
| POST | /photo/download/all/found/:eventId | Public | Download all matched photos (unauth flow) as zip |
| GET | /photo/download/all/event/:eventId | JWT | Download all event photos as zip |
| GET | /photo/download/all/collection/:collectionId/:eventId | JWT | Download all photos from a guest collection as zip |
| DELETE | /photo/delete/event/:eventId | JWT | Delete selected event photos |
| DELETE | /photo/delete/selfie/:collectionId | JWT | Delete selected selfies from collection |

### /collection

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /collection/find-persist/:eventId | JWT | Find matches and persist into authenticated guest collection |
| POST | /collection/find-without-persist/:eventId | Public | Find matches without persisting selfies/collection |
| DELETE | /collection/photo/remove/:collectionId | JWT | Remove photos from guest collection |
| POST | /collection/photo/add/:collectionId | JWT | Add photos to guest collection (manual curation) |
| GET | /collection/all-photos/:collectionId | JWT | Get paginated photos from guest collection |
| GET | /collection/all-selfies/:collectionId | JWT | Get selfies associated with collection |
| GET | /collection/my/:eventId | JWT | Get current user's collection for an event |
| GET | /collection/event/:eventId/user/:userId | JWT | Photographer fetches a specific guest collection |

## Roadmap

- Album-level deduplication and quality scoring
- Multi-face disambiguation controls for guests
- Real-time indexing progress and event readiness dashboard
- Improved admin tooling for manual moderation
- Optional watermarking and branded delivery links

## License

MIT

