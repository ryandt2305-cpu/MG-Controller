import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

const mode = process.argv[2] ?? 'build';
const isDev = mode === 'dev';

const HEADER = `// ==UserScript==
// @name         MG Controller
// @namespace    https://magicgarden.gg
// @version      1.0.0
// @description  Full controller (Xbox/PS) support for Magic Garden
// @author       you
// @match        *://magicgarden.gg/r/*
// @match        *://magiccircle.gg/r/*
// @match        *://starweaver.org/r/*
// @match        *://*.discordsays.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==
`;

const OUT_FILE = 'dist/mg-controller.user.js';

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  outfile: OUT_FILE,
  treeShaking: true,
  sourcemap: isDev ? 'inline' : false,
  minify: !isDev,
  target: 'es2020',
  banner: {
    js: HEADER,
  },
};

if (isDev) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await esbuild.build(options);
  console.log(`Built → ${OUT_FILE}`);
}
