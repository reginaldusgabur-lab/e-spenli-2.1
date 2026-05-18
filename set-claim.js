
const admin = require('firebase-admin');

const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const [uid, role] = process.argv.slice(2);

if (!uid || !role) {
  console.error('Error: Please provide a UID and a role.');
  console.error('Usage: node set-claim.js <user_uid> <role_name>');
  process.exit(1);
}

const validRoles = ['admin', 'kepala_sekolah', 'guru', 'pegawai'];
if (!validRoles.includes(role)) {
    console.error(`Error: Invalid role "${role}".`);
    console.error(`Valid roles are: ${validRoles.join(', ')}`);
    process.exit(1);
}

const claimsToSet = { role: role };

async function setCustomClaim(uid, claims) {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    
    const user = await admin.auth().getUser(uid);
    console.log('Success! Custom claims set for user:');
    console.log('  UID:', uid);
    console.log('  Email:', user.email);
    console.log('  New Claims:', user.customClaims);

  } catch (error) {
    console.error('Error setting custom claims:', error.message);
  }
}

setCustomClaim(uid, claimsToSet);
