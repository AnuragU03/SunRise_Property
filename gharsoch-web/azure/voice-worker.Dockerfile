# voice-worker.Dockerfile — the LiveKit voice agent as a long-running container.
#
# This is the NET-NEW piece of Azure hosting: the Next.js app and the timer
# functions both fit serverless Azure products, but the voice worker is a
# persistent process that holds LiveKit WebSocket sessions, so it needs a
# container (Azure Container Apps recommended — see azure/PROVISIONING.md).
#
# Build context = gharsoch-web/ :
#   docker build -f azure/voice-worker.Dockerfile -t gharsoch-voice-worker .
FROM node:20-bookworm-slim

WORKDIR /app

# System deps for @livekit/rtc-node (native bindings) + Silero VAD onnxruntime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install deps first for layer caching. --legacy-peer-deps matches the repo's
# install convention (LiveKit plugin peer ranges).
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# App + voice worker source (the worker imports lib/** directly).
COPY . .

ENV NODE_ENV=production
# 'start' mode = production worker registration (vs 'dev' hot-reload).
CMD ["npx", "tsx", "voice-agent/index.ts", "start"]
