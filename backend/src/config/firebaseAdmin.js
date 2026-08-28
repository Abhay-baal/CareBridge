const admin = require("firebase-admin");
const fs = require("fs");

let firebaseApp = null;

const getFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountPath && !serviceAccountJson) {
    console.warn("[firebase-admin] No service account configured");
    return null;
  }

  try {
    const serviceAccount = serviceAccountPath
      ? JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
      : JSON.parse(serviceAccountJson);

    const existingApps = admin.getApps();

    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = admin.initializeApp({
        credential: admin.cert(serviceAccount),
      });
    }

    return firebaseApp;
  } catch (error) {
    console.error(
      "[firebase-admin] Failed to initialize:",
      error.message
    );
    return null;
  }
};

module.exports = {
  getFirebaseAdmin,
};
