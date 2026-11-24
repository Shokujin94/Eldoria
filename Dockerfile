FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 DB_PATH=/data/eldoria.sqlite
COPY server/ ./server/
COPY js/49-modelo.js js/50-oficios-modelo.js js/51-online.js js/52-scene-art.js js/52-scene.js ./js/
COPY assets/ ./assets/
COPY index.html version.json ./
COPY css/online51.css ./css/
ENV SERVE_PREVIEW=1
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8787
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","server/server.mjs"]
