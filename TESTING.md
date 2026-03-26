# How to Test DevJSON Locally

To verify that the extension is working correctly and all "Premium" features are functional, follow these steps:

### 🛠 Phase 1: Installation
1.  **Open Chrome Extensions**: Visit `chrome://extensions/` in your browser.
2.  **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right.
3.  **Load Unpacked**: Click the "Load unpacked" button.
4.  **Select Directory**: Browse to `/Users/apple/Documents/code/extensions/2devjson/dist` and click Open.

---

### 🧪 Phase 2: Testing Formats
Visit these sample raw data pages to verify the auto-formatting:

- **JSON Check**: [JSONPlaceholder - Todos](https://jsonplaceholder.typicode.com/todos/1)
- **Deep JSON Check**: [JSONPlaceholder - Large Data](https://jsonplaceholder.typicode.com/posts)
- **XML Check**: [World Bank XML Feed](https://api.worldbank.org/v2/country/all?format=xml)
- **YAML Check**: [Sample YAML Gist](https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml)

---

### 🖱 Phase 3: Verify Interactive Features
Once the tree is rendered:
1.  **Search**: Type "title" in the search bar. All matching keys should be highlighted.
2.  **Collapse**: Click the "▼" arrow next to an object. It should collapse the branch.
3.  **Copy Path**: Right-click on any **Key**. You should see a toast saying "Copied: [Key]".
4.  **Copy Value**: Right-click on any **Value**. You should see a toast saying "Value Copied".
5.  **Structural Diff**:
    - Download a JSON file from the web.
    - Click the "Diff" button in the extension.
    - Upload the downloaded file.
    - The structural differences should be logged to the console and highlighted.

---

### ⚠️ Troubleshooting
- **Not rendering?**: If the page isn't formatted, it may be because of a strict Content Security Policy (CSP) or if the server response isn't detected as raw text/json. This extension aims to capture the entire `document.body.innerText`.
- **Icon not showing?**: Ensure the icons exist in `public/logo.png`.

---
*DevJSON — Transforming your raw data into actionable intelligence.*
