import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STRINGS, type StringKey } from './strings';

describe('translations', () => {
  it('covers every Arabic key in English', () => {
    const arabicKeys = Object.keys(STRINGS.ar) as StringKey[];
    const englishKeys = new Set(Object.keys(STRINGS.en));
    const missing = arabicKeys.filter((key) => !englishKeys.has(key));
    assert.deepEqual(missing, [], 'English is missing keys present in Arabic');
  });

  it('has no English keys that Arabic lacks', () => {
    const englishKeys = Object.keys(STRINGS.en);
    const arabicKeys = new Set(Object.keys(STRINGS.ar));
    const extra = englishKeys.filter((key) => !arabicKeys.has(key));
    assert.deepEqual(extra, [], 'English has keys Arabic does not');
  });

  it('leaves no string empty in either language', () => {
    for (const [locale, table] of Object.entries(STRINGS)) {
      for (const [key, value] of Object.entries(table)) {
        assert.ok(value.trim().length > 0, `${locale}.${key} is empty`);
      }
    }
  });
});
