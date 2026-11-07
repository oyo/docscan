# docscan

Detect and extract documents in images.

## Usage

```javascript
import { Docscan } from 'docscan'

const input = someHTMLImageElement
const output = await Docscan.detect(input)
document.body.appendChild(output)
```
