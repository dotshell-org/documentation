FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;

    location /documentation/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ $uri.html /documentation/index.html;
    }

    location = / {
        return 301 /documentation/;
    }
}
EOF

EXPOSE 80
