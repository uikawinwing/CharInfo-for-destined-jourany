import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repoRoot = new URL('../../', import.meta.url);
const readSource = path => readFile(new URL(path, repoRoot), 'utf8');

const [overviewSource, sheetSource, headerSource] = await Promise.all([
  readSource('src/char_info_viewer/components/specialNpc/SpecialNpcOverviewPanel.vue'),
  readSource('src/char_info_viewer/components/specialNpc/SpecialNpcCharacterSheet.vue'),
  readSource('src/char_info_viewer/components/specialNpc/SpecialNpcHeader.vue'),
]);

test('special NPC overview renders the entrance quote only when display text exists', () => {
  assert.match(sheetSource, /:entrance-quote-text="vm\.entranceQuoteText"/);
  assert.match(overviewSource, /entranceQuoteText\?:\s*string/);
  assert.match(
    overviewSource,
    /<blockquote\s+v-if="entranceQuoteText"\s+class="special-npc-entrance-quote">[\s\S]*?{{ entranceQuoteText }}[\s\S]*?<\/blockquote>/,
  );
});

test('entrance quote keeps one lead ornament, subtle quotation marks, and a quiet closing line', () => {
  assert.match(overviewSource, /@import url\("https:\/\/fontsapi\.zeoseven\.com\/293\/main\/result\.css"\);/);

  const quoteRule = overviewSource.match(/\.special-npc-entrance-quote\s*\{[^}]*\}/)?.[0];
  assert.ok(quoteRule);
  assert.match(quoteRule, /font-family:\s*'LXGW WenKai Mono'/);
  assert.match(quoteRule, /font-style:\s*normal/);
  assert.match(quoteRule, /font-size:\s*clamp\(17px,/);
  assert.match(quoteRule, /border:\s*0/);
  assert.match(quoteRule, /background:\s*none/);
  assert.match(
    overviewSource,
    /class="special-npc-entrance-quote-ornament"\s+aria-hidden="true">[\s\S]*?class="special-npc-entrance-quote-diamond"/,
  );
  assert.equal((overviewSource.match(/class="special-npc-entrance-quote-ornament"/g) ?? []).length, 1);
  assert.match(
    overviewSource,
    /\.special-npc-entrance-quote-ornament::before,[\s\S]*?\.special-npc-entrance-quote-ornament::after/,
  );
  assert.match(overviewSource, /\.special-npc-entrance-quote-text::before\s*\{[^}]*content:\s*'“'/);
  assert.match(overviewSource, /\.special-npc-entrance-quote-text::after\s*\{[^}]*content:\s*'”'/);
  assert.match(overviewSource, /class="special-npc-entrance-quote-tail"\s+aria-hidden="true"/);
  assert.match(overviewSource, /\.special-npc-entrance-quote-tail\s*\{[^}]*linear-gradient/);
  assert.doesNotMatch(overviewSource, /content:\s*'[「」]'/);
});

test('special NPC attributes wrap to three flags over two', () => {
  assert.match(
    overviewSource,
    /\.special-npc-attributes\s*\{[^}]*max-width:\s*calc\(\(var\(--flag-width\) \* 3\) \+ \(var\(--flag-gap\) \* 2\)\);/,
  );
});

test('special and DX overview themes share one geometry scale', () => {
  assert.match(
    sheetSource,
    /\.special-npc-wrapper\s*\{[^}]*--special-npc-flag-width:\s*128px;[^}]*--special-npc-flag-height:\s*128px;[^}]*--special-npc-resource-height:\s*72px;/,
  );
  assert.match(
    overviewSource,
    /\.special-npc-attributes\s*\{[^}]*--flag-width:\s*var\(--special-npc-flag-width\);[^}]*--flag-min-height:\s*var\(--special-npc-flag-height\);/,
  );
  assert.match(overviewSource, /\.special-npc-resource\s*\{[^}]*min-height:\s*var\(--special-npc-resource-height\);/);
});

test('special and DX desktop headers share one readable title scale', () => {
  assert.match(
    headerSource,
    /\.special-npc-header:not\(\.compact\)\s*\{[^}]*min-height:\s*var\(--special-npc-header-min-height\);/,
  );
  assert.match(headerSource, /\.special-npc-name\s*\{[^}]*font-size:\s*clamp\(30px, 4\.2cqw, 38px\);/);
  assert.match(
    headerSource,
    /\.special-npc-header\.ornate \.special-npc-name\s*\{[^}]*white-space:\s*normal;[^}]*text-wrap:\s*balance;/,
  );
  const anastasiaTitleRule = sheetSource.match(
    /\.special-npc-theme-anastasia :deep\(\.special-npc-header \.special-npc-name\)\s*\{[^}]*\}/,
  )?.[0];
  const ailisiTitleRule = sheetSource.match(
    /\.special-npc-theme-ailisi :deep\(\.special-npc-header \.special-npc-name\)\s*\{[^}]*\}/,
  )?.[0];
  assert.ok(anastasiaTitleRule);
  assert.ok(ailisiTitleRule);
  assert.doesNotMatch(anastasiaTitleRule, /font-size:/);
  assert.doesNotMatch(ailisiTitleRule, /font-size:/);
});
