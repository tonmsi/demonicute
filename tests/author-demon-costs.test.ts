import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AUTHOR_DEMONS } from '../src/content/author-demons.js';
import {
  AUTHOR_DEMON_COST_SOURCE, SOURCE_COST_ROWS, AUTHOR_DEMON_COSTS, AUTHOR_DEMON_COST_GAPS,
  SOURCE_COST_EXTRAS, AUTHOR_DEMON_COST_MATCH_SUMMARY, UNCONFIRMED_AUTHOR_DEMON_COST_ALIASES,
  findAuthorDemonCost, normalizeDemonCostName,
} from '../src/content/author-demon-costs.js';

const expectedHash = '1e6875f41c8d0d523b84c9500dfcdd11af87e0ade9f3b9f11298b3155f011478';

test('authorized cost source has the verified hash and only its three cost fields are extracted with exact provenance', async () => {
  const bytes = await readFile(resolve(AUTHOR_DEMON_COST_SOURCE.path));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
  assert.equal(AUTHOR_DEMON_COST_SOURCE.sha256, expectedHash);
  assert.equal(AUTHOR_DEMON_COST_SOURCE.byteLength, bytes.length);
  assert.equal(AUTHOR_DEMON_COST_SOURCE.originalPath, 'G:/Il mio Drive/cutes/2026/demonlord/demoni.json');
  const records = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')) as Record<string, unknown>[];
  assert.equal(records.length, 60);
  assert.equal(SOURCE_COST_ROWS.length, 60);
  for (const [index, row] of SOURCE_COST_ROWS.entries()) {
    const source = records[index];
    assert.equal(row.sourceName, source.nome);
    assert.equal(row.source.row, index + 1);
    assert.equal(row.source.jsonPointer, `/${index}`);
    assert.equal(row.source.locator, `${AUTHOR_DEMON_COST_SOURCE.path}#/${index}`);
    assert.equal(row.source.sha256, expectedHash);
    assert.equal(row.source.path, AUTHOR_DEMON_COST_SOURCE.path);
    assert.equal(row.source.kind, 'author-authorized-cost-json');
    const expectedFields = Object.fromEntries(['costo', 'costo_tipo', 'costo_tipo_minimo'].filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]));
    assert.deepEqual(row.rawFields, expectedFields);
    assert.equal(row.costo, Object.hasOwn(source, 'costo') ? source.costo : null);
    assert.equal(row.costoTipo, Object.hasOwn(source, 'costo_tipo') ? source.costo_tipo : null);
    assert.equal(row.costoTipoMinimo, Object.hasOwn(source, 'costo_tipo_minimo') ? source.costo_tipo_minimo : null);
    for (const excluded of ['effetto', 'elemento', 'livello_stella', 'tipo_effetto', 'quantita']) {
      assert.equal(Object.hasOwn(row, excluded), false);
      assert.equal(Object.hasOwn(row.rawFields, excluded), false);
    }
  }
});

test('name comparison accepts only case, spacing and apostrophes and never guesses spelling aliases', () => {
  assert.equal(normalizeDemonCostName('  Boto Cor  de Rosa '), normalizeDemonCostName('BOTO COR DE ROSA'));
  for (const variant of ["Belzebu'", 'Belzebu’', 'BELZEBU']) assert.equal(normalizeDemonCostName(variant), 'BELZEBU');
  assert.notEqual(normalizeDemonCostName('Keukegen'), normalizeDemonCostName('KUKEGEN'));
  assert.notEqual(normalizeDemonCostName('Beleth'), normalizeDemonCostName('BELLETH'));
  assert.notEqual(normalizeDemonCostName('LEPRECAUNO'), normalizeDemonCostName('LEPRECHAUN'));
  assert.equal(findAuthorDemonCost('author-demon-belzebu')!.authorName, 'BELZEBU');
  assert.equal(findAuthorDemonCost('author-demon-boto-cor-de-rosa')!.sourceName, 'Boto Cor De Rosa');
});

test('39 certain cost matches and 21 gaps exactly partition the author list, while 21 extras partition the cost source', () => {
  assert.deepEqual(AUTHOR_DEMON_COST_MATCH_SUMMARY, { authorRows: 60, sourceRows: 60, matched: 39, gaps: 21, missing: 19, unconfirmedAliases: 2, ambiguousNames: 0, sourceExtras: 21 });
  assert.equal(new Set(AUTHOR_DEMON_COSTS.map(match => match.authorDemonId)).size, 39);
  assert.deepEqual([...AUTHOR_DEMON_COSTS.map(match => match.authorDemonId), ...AUTHOR_DEMON_COST_GAPS.map(gap => gap.authorDemonId)].sort(), AUTHOR_DEMONS.map(demon => demon.id).sort());
  assert.deepEqual([...AUTHOR_DEMON_COSTS.map(match => match.source.jsonPointer), ...SOURCE_COST_EXTRAS.map(row => row.source.jsonPointer)].sort(), SOURCE_COST_ROWS.map(row => row.source.jsonPointer).sort());
  for (const match of AUTHOR_DEMON_COSTS) {
    assert.equal(match.match, 'normalized-name');
    assert.equal(normalizeDemonCostName(match.authorName), normalizeDemonCostName(match.sourceName));
    assert.equal(AUTHOR_DEMONS.find(demon => demon.id === match.authorDemonId)!.name, match.authorName);
  }
});

test('all nineteen missing names and both unconfirmed aliases are reported explicitly without synthetic matches', () => {
  assert.deepEqual(AUTHOR_DEMON_COST_GAPS.filter(gap => gap.status === 'missing').map(gap => gap.name), [
    'MEDUSA', 'LEPRECAUNO', 'BAKU', 'LEPRECHAUN', 'BUNJIP', 'AMMIT', 'PUKA', 'MOLOCH', 'PASAN', 'IMP', 'RYUTO', 'LENGHELO', 'KOTOBUKI', 'NUE', 'MAZMURELLO', 'ZIZ', 'ARPIA', 'ANEMOS', 'CAMAZOTZ',
  ]);
  assert.deepEqual(AUTHOR_DEMON_COST_GAPS.filter(gap => gap.status === 'unconfirmed-alias').map(gap => [gap.name, gap.candidateSourceNames]), [['KUKEGEN', ['Keukegen']], ['BELLETH', ['Beleth']]]);
  assert.equal(UNCONFIRMED_AUTHOR_DEMON_COST_ALIASES.length, 2);
  for (const gap of AUTHOR_DEMON_COST_GAPS) assert.equal(findAuthorDemonCost(gap.authorDemonId), undefined);
  assert.ok(SOURCE_COST_EXTRAS.some(row => row.sourceName === 'Keukegen'));
  assert.ok(SOURCE_COST_EXTRAS.some(row => row.sourceName === 'Beleth'));
  assert.ok(SOURCE_COST_EXTRAS.some(row => row.sourceName === 'Golem'));
});

test('zero stays zero in its source record while absent optional costs stay null and unknown alias cost remains unassigned', () => {
  const zero = SOURCE_COST_ROWS.find(row => row.sourceName === 'Keukegen')!;
  assert.equal(zero.costo, 0);
  assert.equal(zero.rawFields.costo, 0);
  assert.ok(Object.hasOwn(zero.rawFields, 'costo'));
  assert.equal(zero.costoTipo, null);
  assert.equal(zero.costoTipoMinimo, null);
  assert.equal(Object.hasOwn(zero.rawFields, 'costo_tipo'), false);
  assert.equal(Object.hasOwn(zero.rawFields, 'costo_tipo_minimo'), false);
  assert.equal(findAuthorDemonCost('author-demon-kukegen'), undefined);
  const generic = findAuthorDemonCost('author-demon-guaeko')!;
  assert.equal(generic.costo, 2);
  assert.equal(generic.costoTipo, null);
  assert.equal(generic.costoTipoMinimo, null);
  assert.equal(AUTHOR_DEMON_COST_SOURCE.minimumUnit, 'not-specified-in-json');
});

test('cost overlay does not replace author names, stars, effects or the TSV missing-cost value and exports readonly data', () => {
  const badalischio = AUTHOR_DEMONS.find(demon => demon.id === 'author-demon-badalischio')!;
  assert.equal(badalischio.stars, 2);
  assert.equal(badalischio.effectRaw, 'Blocca un demone.');
  assert.equal(badalischio.cost, null);
  assert.equal(findAuthorDemonCost(badalischio.id)!.costo, 1);
  assert.ok(AUTHOR_DEMONS.every(demon => demon.cost === null));
  for (const list of [SOURCE_COST_ROWS, AUTHOR_DEMON_COSTS, AUTHOR_DEMON_COST_GAPS, SOURCE_COST_EXTRAS]) assert.ok(Object.isFrozen(list));
  for (const row of SOURCE_COST_ROWS) {
    assert.ok(Object.isFrozen(row));
    assert.ok(Object.isFrozen(row.rawFields));
    assert.ok(Object.isFrozen(row.source));
  }
});
