# FacelessForge Deployment

FacelessForge is now a fullstack Node app. The backend serves:

- `POST /api/script` for Claude script generation
- `GET /api/footage` for Pexels/Pixabay search
- `GET /api/config` for frontend feature detection
- the built React app from `dist/`

## Environment Variables

Set these on your host:

```bash
ANTHROPIC_API_KEY=your_anthropic_key
PEXELS_API_KEY=your_pexels_key
PIXABAY_API_KEY=your_pixabay_key
APP_ACCESS_TOKEN=private_code_for_you_to_log_in
PORT=3000
```

`APP_ACCESS_TOKEN` is optional, but recommended. When set, the website asks for that code before calling private API routes.

## Local Production Run

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000`.

## Docker Run

```bash
docker build -t facelessforge .
docker run --env-file .env -p 3000:3000 facelessforge
```

## Hosting

Use any host that can run a Node service or Docker container. Set the build command to:

```bash
npm install && npm run build
```

Set the start command to:

```bash
npm start
```

Point your domain to the service URL through your host's DNS/custom-domain settings.
