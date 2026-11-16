This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Release process

Production must flow through Git:

1. Develop and test locally.
2. Commit every intended production change to `redesign-experiment`.
3. Push `redesign-experiment` to `origin`.
4. Run `npm run release:source` to confirm the worktree is clean and local `HEAD` exactly matches the fetched remote branch.
5. Vercel builds the pushed commit through its GitHub integration.
6. Verify the production deployment and smoke-test the changed feature.

Do not run `vercel --prod` from a working directory. A CLI upload can contain uncommitted files, making production impossible to reproduce from Git. If automatic deployment is unavailable, create a Vercel deployment from an explicit Git commit SHA in the Vercel dashboard.

The Vercel project must be connected to `bra-nate/OneScripture`, with `redesign-experiment` configured as its Production Branch.
