# Bank card colours

Checked 16 November 2026. Dashboard and linked-account cards share
`bankCardPalette`; colours do not vary with the app theme.

- PalmPay: `#8F00FF`, from the official site's `.colorBlue` rule:
  https://www.palmpay.com/_next/static/chunks/0sbb0tg55on20.css
- Wema: `#981D87`, from https://wemabank.com/assets/index-YUz_Sodx.css
- OPay: `#1DCF9F`, from its official logo:
  https://gstatic.opayweb.com/website-ng/img/opay-logo.684aa98.svg
  The card stays white with green details, as requested. Darker green is used
  for readable text rather than passing it off as the exact logo green.
- Kuda retains the existing `#40196D` primary. Its site was reachable, but
  its stylesheet could not be retrieved for independent re-verification.
- Other supported banks use exact solid colours sampled from their existing
  bundled logo artwork in `assets/banks`, rather than the previous muted app
  approximations. This is a match to the bundled artwork, not a claim that
  every institution's latest brand guide has been independently verified.
  Examples: Zenith `#ED1C24`, GTBank `#D94F00`, UBA `#D71920`, Access `#114185`.

OPay and PalmPay names are resolved through the same aliases as their logos.
Unrecognized banks use neutral grey until a verified palette is available.
No logo files were recoloured.
