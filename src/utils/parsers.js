import YAML from 'js-yaml';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

/**
 * Robust data parser for JSON, XML, and YAML.
 * Returns { data, type, error }
 */
export const parseData = (content) => {
  const trimmed = content.trim();
  
  // 1. Try JSON (fastest & most common)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { data: JSON.parse(trimmed), type: 'json' };
    } catch (e) {
      // Might be malformed, try others
    }
  }

  // 2. Try XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    try {
      const xmlData = xmlParser.parse(trimmed);
      // Ensure it actually looks like a parsed object
      if (Object.keys(xmlData).length > 0) {
        return { data: xmlData, type: 'xml' };
      }
    } catch (e) {
      // Continue
    }
  }

  // 3. Try YAML
  try {
    const yamlData = YAML.load(trimmed);
    if (typeof yamlData === 'object' && yamlData !== null) {
      return { data: yamlData, type: 'yaml' };
    }
  } catch (e) {
    // Continue
  }

  return { data: null, type: null, error: 'Unsupported format or malformed data' };
};
