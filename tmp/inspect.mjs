import fs from 'fs';

const data = fs.readFileSync('/tmp/rawla-bundle.js', 'utf8');

// Firebase
const fbRegex = /\{apiKey:["'][^"']+["'],authDomain:[^}]+\}/g;
const fbMatch = data.match(fbRegex);
console.log('Firebase config:', fbMatch);

// Cloudinary
const clUrls = data.match(/https:\/\/api\.cloudinary\.com\/v1_1\/[^\/]+\/image\/upload/g);
console.log('Cloudinary URLs:', clUrls);

const presets = data.match(/upload_preset[^,&\s"']*/gi);
console.log('Presets:', presets);

// Collections
const colRegex = /"shops"|"products"|"orders"|"categories"|"users"|"banners"|"reviews"|"favorites"|"settings"|"notifications"/g;
console.log('Matched known collections:', [...new Set(data.match(colRegex))]);

// Look for role definitions or permissions
const roleMatches = data.match(/role\s*===?\s*["'][^"']+["']/g);
console.log('Role checks:', [...new Set(roleMatches)]);

// Super admin email or checks
const superAdmin = data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
console.log('Emails found:', [...new Set(superAdmin)]);
