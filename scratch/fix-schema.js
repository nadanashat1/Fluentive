const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

content = content.replace(/@default\(EMPLOYEE\)/g, '@default(employee)');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Fixed @default(EMPLOYEE) in schema.prisma');
