#!/usr/bin/env node
process.env.REDDIT_ACTION = "deny";
await import("./approve-reddit-engagement.mjs");
