FROM node:18-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY ./package.json ./yarn.lock* ./package-lock.json*  ./
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

RUN npx update-browserslist-db@latest
EXPOSE 3002

CMD yarn dev 