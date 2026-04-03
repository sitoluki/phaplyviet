#!/usr/bin/env tsx
import { startServer } from './src';

const port = parseInt(process.env.PORT ?? '3000', 10);
startServer(port).catch(console.error);
