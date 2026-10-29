# Default account avatars

Local SVG placeholders for accounts without an uploaded avatar. Files are 512 by
512 pixels and scale without losing quality. Vite serves this folder at
`/avatars/`; no external image service is needed at runtime.

| Account role | Asset URL | Appearance | Original icon |
| --- | --- | --- | --- |
| `artisan` | `/avatars/artisan.svg` | Amber circle with hard hat | [Lucide hard-hat](https://lucide.dev/icons/hard-hat) |
| `house_owner` | `/avatars/house_owner.svg` | Green circle with house | [Lucide house](https://lucide.dev/icons/house) |
| `admin` | `/avatars/admin.svg` | Blue circle with shield and person | [Lucide shield-user](https://lucide.dev/icons/shield-user) |

`defaults.json` maps API role values to these URLs. When building the account UI,
use the uploaded `user.avatar.url` when present, otherwise select the role's
default. For an unknown role, use the homeowner default. These assets do not
change the API's `avatar: null` behavior or upload format; avatar uploads accept
JPEG, PNG, and WEBP rather than SVG.

```js
const defaults = await fetch('/avatars/defaults.json').then((res) => res.json());
const avatarUrl = user.avatar?.url ?? defaults[user.role] ?? defaults.house_owner;
```

Downloaded from the [official Lucide repository](https://github.com/lucide-icons/lucide)
on October 29, 2026. The original icon paths are retained, centered inside colored
circles, and given fixed colors, accessible titles, and a 512-pixel size.
Lucide permits use and modification under the [ISC license](https://lucide.dev/license).
The upstream license and copyright notices are included in `LICENSE.lucide.txt`.
