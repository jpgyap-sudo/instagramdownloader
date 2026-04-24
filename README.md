# instagramdownloader

This project uses the `RAPIDAPI_KEY` environment variable to authenticate requests to the Instagram scraper API.

## Setup

1. Create a local environment file named `.env.local` in the project root.
2. Add your API key to the file:

```
RAPIDAPI_KEY=4d4c757596msh3011428730bf7fdp105c74jsn4c4752f6bb04
```

3. Run the app locally with:

```
npm run dev
```

## Vercel Deployment

In Vercel, add an environment variable named `RAPIDAPI_KEY` with your API key value under the project settings.

Also make sure your RapidAPI account is subscribed to the `instagram-scraper-stable-api` API. If the key is valid but the API is not subscribed, the route will fail with an authorization error.

This keeps the secret out of source control while allowing the API route at `pages/api/fetch.js` to access the key securely.
