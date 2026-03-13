#!/usr/bin/env node
/**
 * Genereert llms.txt vanuit TypeScript bronbestanden.
 * Extraheert JSDoc-commentaar en type-signaturen voor alle geëxporteerde symbolen,
 * gegroepeerd per module. Uitvoeren via: node scripts/generate-llms.mjs
 */

import ts from 'typescript';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Pakketmetadata ───────────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

// ── TypeScript programma ─────────────────────────────────────────────────────

const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();

// ── Hulpfuncties ─────────────────────────────────────────────────────────────

/**
 * Extraheert de tekstinhoud van een JSDoc-commentaarblok op een node.
 * Voor VariableDeclarations wordt gekeken naar de bovenliggende VariableStatement.
 */
function getJSDoc(node) {
  // JSDoc staat op VariableStatement, niet op VariableDeclaration
  let target = node;
  if (ts.isVariableDeclaration(node) && node.parent && ts.isVariableDeclarationList(node.parent)) {
    target = node.parent.parent;
  }

  const comments = ts.getJSDocCommentsAndTags(target);
  for (const item of comments) {
    if (ts.isJSDoc(item) && item.comment) {
      const c = item.comment;
      if (typeof c === 'string') return c.trim();
      // NodeArray<JSDocComment> (array van commentaarnodes)
      return c.map((p) => (typeof p === 'string' ? p : p.text ?? '')).join('').trim();
    }
  }
  return '';
}

/**
 * Geeft een leesbaar soortlabel terug voor een declaratie-node.
 */
function getKind(node) {
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isFunctionDeclaration(node)) return 'function';
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isEnumDeclaration(node)) return 'enum';
  if (ts.isVariableDeclaration(node)) return 'const';
  return '';
}

/**
 * Geeft de gedeclareerde type-signatuurstring terug voor een symbool.
 * Voor aanroepbare symbolen (functies, constructors) wordt de aanroepsignatuur teruggegeven.
 * Valt terug op een eenvoudige type-string.
 */
function getSignature(symbol, decl) {
  try {
    const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
    const callSigs = type.getCallSignatures();
    if (callSigs.length > 0) {
      return checker.signatureToString(callSigs[0]);
    }
    const str = checker.typeToString(type);
    // Sla zeer lange of onleesbare objecttypes over
    if (str.length > 300 || str.startsWith('{')) return '';
    return str;
  } catch {
    return '';
  }
}

/**
 * Verzamelt alle geëxporteerde symbolen uit een bronbestand.
 * Slaat symbolen over waarvan de declaraties in node_modules staan.
 */
function getModuleExports(filePath) {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) return [];

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) return [];

  const exports = checker.getExportsOfModule(moduleSymbol);
  const results = [];

  for (const sym of exports) {
    const decls = sym.getDeclarations();
    if (!decls || decls.length === 0) continue;

    const decl = decls[0];
    const declFile = decl.getSourceFile().fileName;

    // Sla externe package re-exports over
    if (declFile.includes('node_modules')) continue;

    const doc = getJSDoc(decl);
    const kind = getKind(decl);
    const sig = getSignature(sym, decl);

    results.push({ name: sym.getName(), doc, kind, sig });
  }

  // Stabiele volgorde: interfaces/types eerst, dan classes, functies, consts
  const ORDER = { interface: 0, type: 1, enum: 2, class: 3, function: 4, const: 5, '': 6 };
  results.sort((a, b) => (ORDER[a.kind] ?? 6) - (ORDER[b.kind] ?? 6) || a.name.localeCompare(b.name));

  return results;
}

// ── Modulesecties ────────────────────────────────────────────────────────────

const MODULES = [
  { dir: 'patterns', title: 'Patterns' },
  { dir: 'ticker', title: 'Ticker' },
  { dir: 'tween', title: 'Tween' },
  { dir: 'delay', title: 'Delay' },
  { dir: 'events', title: 'Events' },
  { dir: 'screen', title: 'Screen & Stage' },
  { dir: 'loaders', title: 'Asset Loaders' },
  { dir: 'media/sounds', title: 'Audio' },
  { dir: 'device', title: 'Device' },
  { dir: 'app', title: 'App' },
  { dir: 'data', title: 'Data' },
  { dir: 'logger', title: 'Logger' },
  { dir: 'debug', title: 'Debug' },
  { dir: 'util', title: 'Utilities' },
  { dir: 'ui', title: 'UI Components' },
  { dir: 'filters', title: 'Filters' },
  { dir: 'html', title: 'HTML' },
  { dir: 'input', title: 'Input' },
];

// ── Uitvoer opbouwen ─────────────────────────────────────────────────────────

const lines = [];

lines.push(`# ${pkg.name}`);
lines.push('');
lines.push(
  '> Kern TypeScript-bibliotheek voor de interactieve webprojecten van Studio Kloek (games, animaties, mediarijke applicaties).',
);
lines.push('');
lines.push(
  'Biedt een uniforme toolkit die PIXI.js (2D-graphics), GSAP (animaties), ' +
  'Howler.js (audio) en Capacitor (native app-koppeling) integreert. ' +
  'Ontworpen als de gemeenschappelijke basislaag voor alle Studio Kloek-projecten.',
);
lines.push('');
lines.push(`**Version:** ${pkg.version}`);
lines.push('');

// Initialisatiesectie (speciaal — staat in src/index.ts, niet in een submodule)
lines.push('## Initialisatie');
lines.push('');
lines.push(
  'Roep `initCoreLibrary(options?)` eenmalig aan bij het opstarten van de applicatie, vóór het gebruik van enig ander onderdeel van de bibliotheek.',
);
lines.push('');
lines.push('```typescript');
lines.push("import { initCoreLibrary } from '@studiokloek/ts-core-lib';");
lines.push('');
lines.push('await initCoreLibrary({');
lines.push("  assetsBasePath: './assets/',");
lines.push('  resolutionBreakPoints: { ios: 1024, android: 1280, desktop: 1280 },');
lines.push('});');
lines.push('```');
lines.push('');
lines.push(
  'Intern stelt dit GSAP/PixiPlugin in, voert Capacitor apparaat-/netwerk-/app-detectie uit, ' +
  'en initialiseert de schermbeheerder en de logger.',
);
lines.push('');
lines.push('`CoreLibraryOptions` biedt toegang tot de opgeloste runtime-waarden:');
lines.push('- `CoreLibraryOptions.ASSET_BASE_PATH` — basispad dat voor alle asset-URLs wordt geplaatst');
lines.push('- `CoreLibraryOptions.RESOLUTION_BREAKPOINTS` — pixelbreekpunten per platform');
lines.push('');

// Derde partij re-exports notitie
lines.push('## Re-exports van derde partijen');
lines.push('');
lines.push('`Mixin`, `hasMixin` — van **ts-mixer**, gebruikt om View/Mediator/Mixin-klassen samen te stellen.');
lines.push('`AsyncEvent`, `SyncEvent` — van **ts-events**, getypeerde event-emitters.');
lines.push('');

// Per-modulesecties
for (const mod of MODULES) {
  const indexPath = join(root, 'src', mod.dir, 'index.ts');
  if (!existsSync(indexPath)) continue;

  const exports = getModuleExports(indexPath);
  if (exports.length === 0) continue;

  lines.push(`## ${mod.title}`);
  lines.push('');

  for (const exp of exports) {
    // Neem alleen vermeldingen op die een JSDoc-beschrijving hebben
    if (!exp.doc) continue;

    const kindLabel = exp.kind ? ` *(${exp.kind})*` : '';
    lines.push(`### \`${exp.name}\`${kindLabel}`);
    lines.push('');
    lines.push(exp.doc);
    lines.push('');

    if (exp.sig) {
      lines.push('```typescript');
      lines.push(exp.sig);
      lines.push('```');
      lines.push('');
    }
  }

  // Lijst ongedocumenteerde symbolen compact zodat niets onzichtbaar blijft
  const undoc = exports.filter((e) => !e.doc);
  if (undoc.length > 0) {
    lines.push(`*Ook geëxporteerd: ${undoc.map((e) => `\`${e.name}\``).join(', ')}*`);
    lines.push('');
  }
}

// ── Bestand schrijven ────────────────────────────────────────────────────────

const output = lines.join('\n');
writeFileSync(join(root, 'llms.txt'), output, 'utf-8');
console.log(`✓ llms.txt gegenereerd (${output.length} tekens, ${lines.length} regels)`);
