#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const SOURCE_ROOT = path.join(PROJECT_ROOT, 'src');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);
const HELPER_NAMES = ['getErrorMessage', 'readErrorMessage'];
const SHARED_ERROR_IMPORT_PATH = 'shared/errors/apiError';

const SKIP_FILES = new Set([
  path.join(SOURCE_ROOT, 'shared', 'errors', 'apiError.ts'),
  path.join(SOURCE_ROOT, 'State', 'Backend', 'masterApi', 'shared.ts'),
]);

const walkFiles = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'build') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }
    if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

const findMatchingBrace = (content, openIndex) => {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = openIndex; i < content.length; i += 1) {
    const ch = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
};

const findStatementEnd = (content, startIndex) => {
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = startIndex; i < content.length; i += 1) {
    const ch = content[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (inSingle) {
      if (ch === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === '`') inTemplate = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    if (ch === '(') depthParen += 1;
    if (ch === ')') depthParen -= 1;
    if (ch === '[') depthBracket += 1;
    if (ch === ']') depthBracket -= 1;
    if (ch === '{') depthBrace += 1;
    if (ch === '}') depthBrace -= 1;

    if (
      ch === ';' &&
      depthParen === 0 &&
      depthBracket === 0 &&
      depthBrace === 0
    ) {
      return i;
    }
  }

  return -1;
};

const removeHelperDeclarations = (content, helperName) => {
  let next = content;
  let removed = 0;

  const signatureRegex = new RegExp(
    `const\\s+${helperName}\\s*=\\s*\\(\\s*error:\\s*unknown\\s*,\\s*fallback:\\s*string\\s*\\)(?:\\s*:\\s*string)?\\s*=>`,
    'm',
  );

  while (true) {
    const match = next.match(signatureRegex);
    if (!match || typeof match.index !== 'number') break;

    const start = match.index;
    let bodyStart = start + match[0].length;
    while (bodyStart < next.length && /\s/.test(next[bodyStart])) {
      bodyStart += 1;
    }

    let end = -1;
    if (next[bodyStart] === '{') {
      const closeBrace = findMatchingBrace(next, bodyStart);
      if (closeBrace === -1) break;
      end = closeBrace + 1;
      while (end < next.length && /\s/.test(next[end])) end += 1;
      if (next[end] === ';') end += 1;
    } else {
      const statementEnd = findStatementEnd(next, bodyStart);
      if (statementEnd === -1) break;
      end = statementEnd + 1;
    }

    next = `${next.slice(0, start)}${next.slice(end)}`.replace(
      /\n{3,}/g,
      '\n\n',
    );
    removed += 1;
  }

  return { content: next, removed };
};

const ensureSharedErrorImport = (content) => {
  if (!/\bgetErrorMessage\s*\(/.test(content)) {
    return content;
  }

  const importRegex = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${SHARED_ERROR_IMPORT_PATH}['"];?`,
    'm',
  );
  const existing = content.match(importRegex);
  if (existing) {
    if (existing[1].includes('getErrorMessage')) return content;
    const updatedSpecifiers = `${existing[1].trim()}, getErrorMessage`
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');
    return content.replace(
      importRegex,
      `import { ${updatedSpecifiers} } from '${SHARED_ERROR_IMPORT_PATH}';`,
    );
  }

  const importBlockMatch = content.match(/^(?:import[\s\S]*?;\r?\n)+/);
  const importLine = `import { getErrorMessage } from '${SHARED_ERROR_IMPORT_PATH}';\n`;

  if (importBlockMatch) {
    const block = importBlockMatch[0];
    return `${block}${importLine}${content.slice(block.length)}`;
  }

  return `${importLine}${content}`;
};

const processFile = (filePath) => {
  if (SKIP_FILES.has(filePath)) return false;

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;
  let removedTotal = 0;

  for (const helperName of HELPER_NAMES) {
    const result = removeHelperDeclarations(updated, helperName);
    updated = result.content;
    removedTotal += result.removed;
  }

  if (removedTotal === 0 && !/\breadErrorMessage\s*\(/.test(updated)) {
    return false;
  }

  updated = updated.replace(/\breadErrorMessage\s*\(/g, 'getErrorMessage(');
  updated = ensureSharedErrorImport(updated);

  if (updated === original) return false;

  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
};

const repairLegacySharedBridge = () => {
  const sharedBridgePath = path.join(
    SOURCE_ROOT,
    'State',
    'Backend',
    'masterApi',
    'shared.ts',
  );

  if (!fs.existsSync(sharedBridgePath)) return null;

  const canonicalBridge = `export { api, publicApi } from 'shared/api/Api';
export { API_ROUTES } from 'shared/api/ApiRoutes';
export {
  type ApiRequestError,
  getApiError,
  getDisplayErrorMessage,
  getErrorMessage,
  getThunkErrorMessage,
} from 'shared/errors/apiError';
`;

  const existing = fs.readFileSync(sharedBridgePath, 'utf8');
  if (existing === canonicalBridge) {
    return null;
  }

  fs.writeFileSync(sharedBridgePath, canonicalBridge, 'utf8');
  return path.relative(PROJECT_ROOT, sharedBridgePath);
};

const main = () => {
  const bridgeFile = repairLegacySharedBridge();
  const files = walkFiles(SOURCE_ROOT);
  const changedFiles = [];

  if (bridgeFile) {
    changedFiles.push(bridgeFile);
  }

  for (const filePath of files) {
    if (processFile(filePath)) {
      changedFiles.push(path.relative(PROJECT_ROOT, filePath));
    }
  }

  if (changedFiles.length === 0) {
    console.log('No local error helper replacements were needed.');
    return;
  }

  console.log('Replaced local error helpers in files:');
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
};

main();
