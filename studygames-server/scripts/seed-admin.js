require('dotenv').config();

const { scryptSync, randomBytes } = require('crypto');
const { getFirestore } = require('../dist/app/firebase-admin');

const USERS_COLLECTION = 'users';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  const role = parseInt(process.env.ADMIN_ROLE || '11', 10);

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  const db = getFirestore();
  const key = username.toLowerCase();
  const existing = await db
    .collection(USERS_COLLECTION)
    .where('usernameLower', '==', key)
    .limit(1)
    .get();

  const passwordHash = hashPassword(password);

  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await ref.update({ passwordHash, role });
    console.log(`Updated admin: ${username} (role=${role})`);
  } else {
    const uid = `usr_${randomBytes(12).toString('hex')}`;
    await db.collection(USERS_COLLECTION).doc(uid).set({
      uid,
      username,
      usernameLower: key,
      passwordHash,
      createdAt: Date.now(),
      role,
    });
    console.log(`Created admin: ${username} (role=${role}, uid=${uid})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
