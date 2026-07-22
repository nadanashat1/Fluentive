const fs = require('fs');
const file = 'd:/Fluentive/Fluentive/src/app/api/i18n/route.ts';
let content = fs.readFileSync(file, 'utf8');

// The problematic string might have \r\n or trailing spaces
const regex = /import {\s*\n*import { Roles, RoleType } from '@\/constants\/roles';\s*\n*translations/g;
content = content.replace(regex, "import { Roles, RoleType } from '@/constants/roles';\nimport {\n  translations");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed i18n route');
