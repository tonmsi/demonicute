import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AUTHOR_DEMONS, AUTHOR_DEMON_SOURCE, AUTHOR_DEMONS_VERSION } from '../src/content/author-demons.js';

const expectedHash = '73782cecc9c0a4ca4ae9e4170f84f72d4d5e37bb9b002dc4f717be3fbe421e25';
const byName = (name: string) => {
  const demon = AUTHOR_DEMONS.find(demon => demon.name === name);
  assert.ok(demon, `Nome fonte presente: ${name}`);
  return demon;
};

test('author Demon source copy has the verified original bytes and exactly 60 unique six-column records', async () => {
  const bytes = await readFile(resolve(AUTHOR_DEMON_SOURCE.path));
  assert.equal(bytes.length, 6977);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
  assert.equal(AUTHOR_DEMON_SOURCE.sha256, expectedHash);
  assert.equal(AUTHOR_DEMON_SOURCE.byteLength, bytes.length);
  assert.equal(AUTHOR_DEMON_SOURCE.hasHeader, false);
  assert.equal(AUTHOR_DEMON_SOURCE.rowCount, 60);
  assert.equal(AUTHOR_DEMONS.length, 60);
  assert.equal(new Set(AUTHOR_DEMONS.map(demon => demon.name)).size, 60);
  assert.equal(new Set(AUTHOR_DEMONS.map(demon => demon.id)).size, 60);
  const lines = bytes.toString('utf8').split(/\r?\n/);
  assert.equal(lines.filter(line => line !== '').length, 60);
  for (const demon of AUTHOR_DEMONS) {
    const columns = lines[demon.source.row - 1].split('\t');
    assert.equal(columns.length, 6);
    assert.deepEqual(demon.rawColumns, columns);
    assert.equal(demon.name, columns[0]);
    assert.equal(demon.element, columns[1]);
    assert.equal(demon.stars, Number(columns[2]));
    assert.equal(demon.timingRaw, columns[3]);
    assert.equal(demon.notesRaw, columns[4]);
    assert.equal(demon.effectRaw, columns[5]);
    assert.equal(demon.source.kind, 'author-supplied-list');
    assert.equal(demon.source.sha256, expectedHash);
    assert.equal(demon.source.path, AUTHOR_DEMON_SOURCE.path);
    assert.equal(demon.source.locator, `${AUTHOR_DEMON_SOURCE.path}:${demon.source.row}`);
    assert.match(demon.id, /^author-demon-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});

test('author list preserves its own element, star and timing distributions without historical data', () => {
  for (const element of ['Acqua', 'Aria', 'Etere', 'Fuoco', 'Terra']) assert.equal(AUTHOR_DEMONS.filter(demon => demon.element === element).length, 12);
  assert.deepEqual([1, 2, 3].map(stars => AUTHOR_DEMONS.filter(demon => demon.stars === stars).length), [22, 18, 20]);
  assert.deepEqual(['E', 'A', 'P', 'E/P', 'unresolved'].map(timing => AUTHOR_DEMONS.filter(demon => demon.timing === timing).length), [23, 11, 12, 2, 12]);
  assert.equal(byName('KAPPA').stars, 1);
  assert.equal(byName('BADALISCHIO').stars, 2);
  assert.equal(byName('HAFGUFA').effectRaw, 'Prendi 2 carte a caso dagli scarti.');
  assert.equal(byName('BOTO COR DE ROSA').timing, 'A');
  assert.equal(byName('JINN').timing, 'E');
});

test('all 12 unresolved timings remain unresolved including blanks, question mark and A-or-E alternative', () => {
  assert.deepEqual(AUTHOR_DEMONS.filter(demon => demon.timing === 'unresolved').map(demon => demon.name), [
    'TIFONE', 'EURIDICE', 'BAFOMETTO', 'ECHIDNA', 'BELFAGOR', 'ZIZ', 'STOLAS', 'BANSHEE', 'ARPIA', 'TENGU', 'ANEMOS', 'CAMAZOTZ',
  ]);
  assert.equal(byName('TIFONE').timingRaw, 'A o E?');
  assert.equal(byName('ECHIDNA').timingRaw, '?');
  assert.equal(AUTHOR_DEMONS.filter(demon => demon.timingRaw === '').length, 10);
  for (const demon of AUTHOR_DEMONS.filter(demon => demon.timing === 'unresolved')) {
    assert.equal(demon.completeness.timing, 'unresolved');
    assert.ok(demon.issues.some(issue => issue.code === 'timing-missing' || issue.code === 'timing-ambiguous'));
  }
  assert.equal(byName('LEPRECAUNO').timing, 'E/P');
  assert.equal(byName('LEPRECHAUN').timing, 'E/P');
});

test('fifth-column markers, unresolved notes and Stolas variants are preserved and never converted into costs', () => {
  const marked = AUTHOR_DEMONS.filter(demon => demon.notesRaw === '1');
  assert.equal(marked.length, 10);
  for (const demon of marked) {
    assert.equal(demon.cost, null);
    assert.equal(demon.completeness.notes, 'unresolved');
    assert.ok(demon.issues.some(issue => issue.code === 'note-marker-unresolved'));
  }
  assert.deepEqual(AUTHOR_DEMONS.filter(demon => demon.notesRaw === '____').map(demon => demon.name), ['LUCIFERO', 'TIFONE']);
  assert.equal(byName('WINDIGO').notesRaw, 'sposta nel limbo?');
  assert.ok(byName('WINDIGO').issues.some(issue => issue.code === 'note-question'));
  const stolas = byName('STOLAS');
  assert.match(stolas.notesRaw, /rimetti lo stesso numero.*in cima al mazzo/);
  assert.equal(stolas.effectRaw, 'Pesca una carta per ogni gemma in tuo possesso');
  assert.ok(stolas.issues.some(issue => issue.code === 'effect-variants'));
  assert.ok(AUTHOR_DEMONS.every(demon => demon.cost === null && demon.completeness.cost === 'not-provided'));
});

test('distinct author names, spelling, Unicode and trailing whitespace remain exact; no assets or executable effects are invented', () => {
  assert.notEqual(byName('LEPRECAUNO').id, byName('LEPRECHAUN').id);
  assert.equal(byName('LEPRECAUNO').element, 'Acqua');
  assert.equal(byName('LEPRECHAUN').element, 'Etere');
  assert.equal(byName('BELLETH').name, 'BELLETH');
  assert.match(byName('BAKU').effectRaw, /^Slocca una pila/);
  assert.match(byName('MEDUSA').effectRaw, /blocca un una pila/);
  assert.match(byName('HAFGUFA').notesRaw, /💧/u);
  assert.equal(byName('ZIN').effectRaw, 'Prendi un elemento dagli scarti. ');
  for (const demon of AUTHOR_DEMONS) {
    assert.equal(demon.modifier, null);
    assert.equal(demon.imagePath, null);
    assert.equal(demon.completeness.modifier, 'not-provided');
    assert.equal(demon.completeness.artwork, 'not-provided');
    assert.equal(demon.completeness.effect, 'source-text-only');
    assert.equal(Object.hasOwn(demon, 'fixture'), false);
    assert.equal(Object.hasOwn(demon, 'effect'), false);
  }
});

test('standalone extracted JSON and readonly TypeScript catalog agree in every field', async () => {
  const extracted = JSON.parse(await readFile(resolve('docs/sources/author-demons-2026-09-10.json'), 'utf8'));
  assert.deepEqual(extracted.metadata, AUTHOR_DEMON_SOURCE);
  assert.deepEqual(extracted.demons, AUTHOR_DEMONS);
  assert.equal(AUTHOR_DEMONS_VERSION, 'author-demons-2026-09-10-v1');
  assert.ok(Object.isFrozen(AUTHOR_DEMONS));
  for (const demon of AUTHOR_DEMONS) {
    assert.ok(Object.isFrozen(demon));
    assert.ok(Object.isFrozen(demon.source));
    assert.ok(Object.isFrozen(demon.rawColumns));
    assert.ok(Object.isFrozen(demon.completeness));
    assert.ok(Object.isFrozen(demon.issues));
  }
});
