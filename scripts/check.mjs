import { checkSite } from './lib/site.mjs';
import '../tests/verify-app-assets.mjs';
const files = await checkSite();
console.log(`Static checks passed: ${files.length} release files, anchors, RU/EN, JavaScript and PDFs.`);
