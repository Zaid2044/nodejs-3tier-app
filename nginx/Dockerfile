FROM nginx:1.25-alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
