# MCMenu Format
A `.mcmenu` file is just a `JSON (JavaScript Object Notation)` file with another extension encoded with `UTF-8`.

## Format History
####  Version 1
File layout of `.mcmenu` file version 1:
```js
{
  // Metadata of the file
  "metadata": {
    // File format version, the property
    // location should never change
    "formatVersion": 1,
    // The minecraft version, to use
    // ids (<1.13) or names (1.13+)
    "minecraftVersion": "1.8"
  },
  
  // The menu title, allows color codes
  "title": string,
  
  // A matrix of items, the main content
  // of the menu, an empty item may be
  // represented with the literal 'null'
  "rows": [
    [
      // A single item representation
      {
        // "type" may be an int or a string
        // depending on "minecraftVersion" property
        // in "metadata" section
        "type": int or string,
        // The item display name, allows color codes
        "displayName": "string",
        // The item lore, allows color codes
        "lore": ["line1", "line2"]
      }
    ]
  ]
}
```
