import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/**
 * oneDark's violets and greens fight the brass palette, so the editor gets its
 * own theme: gold keywords, sage strings, cool numerals, everything else quiet.
 */

const INK_950 = 'oklch(0.155 0.008 265)'
const INK_800 = 'oklch(0.265 0.011 265)'
const INK_600 = 'oklch(0.48 0.014 265)'
const INK_500 = 'oklch(0.6 0.014 265)'
const INK_100 = 'oklch(0.9 0.006 265)'
const BRASS_400 = 'oklch(0.8 0.13 84)'
const BRASS_500 = 'oklch(0.72 0.14 80)'
const BRASS_300 = 'oklch(0.86 0.11 86)'

export const marrowgateEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: INK_100,
      fontSize: '13.5px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.7',
      padding: '14px 0',
    },
    '.cm-content': { caretColor: BRASS_400 },
    '&.cm-focused': { outline: 'none' },

    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'oklch(0.4 0.012 265)',
      border: 'none',
      paddingRight: '4px',
      minWidth: '2.75rem',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 16px' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: BRASS_500 },
    '.cm-activeLine': { backgroundColor: 'oklch(1 0 0 / 0.028)' },

    '.cm-cursor, .cm-dropCursor': { borderLeftColor: BRASS_400, borderLeftWidth: '2px' },
    '.cm-selectionBackground, ::selection': { backgroundColor: 'oklch(0.72 0.14 80 / 0.25)' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: 'oklch(0.72 0.14 80 / 0.3)' },
    '.cm-selectionMatch': { backgroundColor: 'oklch(0.72 0.14 80 / 0.14)' },
    '.cm-matchingBracket': {
      backgroundColor: 'oklch(0.72 0.14 80 / 0.18)',
      outline: `1px solid ${BRASS_500}`,
      color: 'inherit',
    },

    '.cm-tooltip': {
      backgroundColor: 'oklch(0.195 0.009 265)',
      border: `1px solid ${INK_800}`,
      borderRadius: '8px',
      boxShadow: '0 12px 32px oklch(0 0 0 / 0.5)',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '12.5px' },
    '.cm-tooltip-autocomplete > ul > li': { padding: '4px 10px' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'oklch(0.72 0.14 80 / 0.18)',
      color: BRASS_300,
    },
    '.cm-completionIcon': { display: 'none' },
    '.cm-completionLabel': { color: INK_100 },
    '.cm-completionDetail': { color: INK_600, fontStyle: 'normal', marginLeft: '10px' },

    '.cm-placeholder': { color: INK_600 },
    '.cm-panels': { backgroundColor: INK_950, color: INK_100 },
  },
  { dark: true },
)

export const marrowgateHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: BRASS_400, fontWeight: '500' },
    { tag: tags.operatorKeyword, color: BRASS_400, fontWeight: '500' },
    { tag: [tags.string, tags.special(tags.string)], color: 'oklch(0.81 0.1 148)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'oklch(0.81 0.085 232)' },
    { tag: tags.comment, color: INK_600, fontStyle: 'italic' },
    { tag: [tags.operator, tags.punctuation, tags.separator], color: INK_500 },
    { tag: [tags.variableName, tags.propertyName], color: INK_100 },
    { tag: tags.typeName, color: 'oklch(0.85 0.07 60)' },
    { tag: tags.function(tags.variableName), color: 'oklch(0.86 0.06 300)' },
    { tag: tags.invalid, color: 'oklch(0.68 0.19 25)' },
  ]),
)
