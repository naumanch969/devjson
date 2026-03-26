import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'DevJSON — Premium Data Explorer',
  description: 'Premium explorer for JSON, XML, and YAML. Features structural diffing, instant search, and developer-centric copy actions.',
  version: pkg.version,
  icons: {
    16: 'public/icon-16.png',
    32: 'public/icon-32.png',
    48: 'public/icon-48.png',
    128: 'public/icon-128.png',
  },
  content_scripts: [{
    js: ['src/content/main.js'],
    matches: ['https://*/*'],
  }],
  permissions: [],
})
