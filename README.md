# DevJSON — Premium Data Explorer for Chrome

DevJSON is a high-performance, aesthetically pleasing browser extension that transforms raw JSON, XML, and YAML into a clean, interactive hierarchical tree. Designed for developers who value clarity, speed, and structural intelligence.

![DevJSON Header](https://source.unsplash.com/featured/?code,data)

## Features

- **Triple-Format Support**: Instantly detects and formats JSON, XML, and YAML data on any URL.
- **Instant Semantic Search**: Real-time filtering and highlighting across keys and values.
- **Premium Aesthetics**: Modern typography, balanced color palettes, and subtle animations. Dark mode by default.
- **Structural Diff Mode**: Upload a local file to compare against the current page and see structural changes.
- **Interactive Tree**: Collapsible nodes, indent guides, and depth indicators.
- **Developer Productivity**: 
  - **Right-click to Copy Path/Value**
  - **Raw Mode Toggle**
  - **Data Size Indicator**
- **Performance First**: Optimized DOM-based rendering for large payloads.

## Installation

### From Source (Developer Mode)
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/2devjson.git
   cd 2devjson
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable **Developer mode** (top right).
   - Click **Load unpacked** and select the `dist` folder.

## Usage

Simply visit any URL that returns JSON, XML, or YAML (e.g., an API endpoint). DevJSON will automatically detect the content and render the interactive explorer.

- **Search**: Start typing in the search bar to filter nodes.
- **Diff**: Click the "Diff" button and upload a file to see differences.
- **Copy**: Right-click any key to copy its path, or any value to copy the JSON value.

## Tech Stack

- **Core**: Vanilla Javascript & CSS
- **Bundler**: Vite + CRXJS
- **Parsing**: `fast-xml-parser`, `js-yaml`
- **Diffing**: `jsondiffpatch`

## License

MIT © [Your Name]
