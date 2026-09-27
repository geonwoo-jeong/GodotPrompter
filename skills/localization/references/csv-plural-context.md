> ← Back to [SKILL.md](../SKILL.md)

# CSV Plural and Context Support (Godot 4.6+)

Godot 4.6 adds context and plural forms to CSV translations. On Godot 4.3–4.5, use PO files for these features.

## Columns and Rule Row

| Field | Purpose |
|-------|---------|
| `?context` column | Disambiguates the same key with different meanings, such as a noun and a verb |
| `?plural` column | Source plural string/key passed as the second argument to `tr_n()` |
| `?pluralrule` special row | Optional per-locale Gettext plural expression, including `nplurals`; this is a row key, not a header column or CLDR category index |

Put the first translated plural form on the keyed row. Put each additional form on a following row with empty key, context, and plural cells. Leave unused locale cells empty when languages need different numbers of forms. Without an explicit rule, Godot uses the locale's default plural rule.

## Example CSV with Context and Plurals

This file supplies two forms for English and German and three for Czech. The rules return a zero-based index into each locale's translated forms.

```csv
keys,?context,?plural,en,cs,de
?pluralrule,,,nplurals=2; plural=(n != 1);,nplurals=3; plural=(n == 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2;,nplurals=2; plural=(n != 1);
ITEM_FILE,noun,,File,Soubor,Datei
ITEM_FILE,verb,,File,Uložit,Ablegen
ENEMY_COUNT,,ENEMY_COUNT_PLURAL,{count} enemy,{count} nepřítel,{count} Feind
,,,{count} enemies,{count} nepřátelé,{count} Feinde
,,,,{count} nepřátel,
```

Import the CSV and register its generated translations in **Project Settings → Localization → Translations** before calling these examples.

## Using Context in Code

```gdscript
# Translate with context to disambiguate identical keys.
var file_noun: String = tr("ITEM_FILE", "noun")
var file_verb: String = tr("ITEM_FILE", "verb")

# No empty-context entry exists above, so this falls back to "ITEM_FILE".
var file_default: String = tr("ITEM_FILE")
```

```csharp
string fileNoun = Tr("ITEM_FILE", "noun");
string fileVerb = Tr("ITEM_FILE", "verb");
string fileDefault = Tr("ITEM_FILE"); // "ITEM_FILE": no empty-context entry.
```

## Selecting and Formatting a Plural

`tr_n()` / `TrN()` select the translated form; they do **not** substitute the count. Format the result explicitly. The named placeholder below is shared by both language examples.

```gdscript
var enemy_count := 3
var msg: String = tr_n("ENEMY_COUNT", "ENEMY_COUNT_PLURAL", enemy_count).format({"count": enemy_count})
# English: "3 enemies"; Czech: "3 nepřátelé"; German: "3 Feinde".
```

```csharp
int enemyCount = 3;
string msg = TrN("ENEMY_COUNT", "ENEMY_COUNT_PLURAL", enemyCount)
    .Replace("{count}", enemyCount.ToString());
```

**Choosing PO or CSV:** Both support three or more plural forms on Godot 4.6+. Choose according to your translation workflow; PO remains useful with Gettext tooling and is required for these features on older Godot versions. See the [official CSV plural-form reference](https://docs.godotengine.org/en/stable/tutorials/i18n/localization_using_spreadsheets.html#specifying-plural-forms).
