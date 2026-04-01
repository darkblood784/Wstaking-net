import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { loadEnvConfig } from "./envLoader";

export interface ReferralData {
  ip: string | null;
  country: string | null;
  isNewUser: boolean;
  network: string;
  referralCode: string;
  walletAddress: string;
  time: number;
}

function blockedReferralClientAccess(operation: string): never {
  throw new Error(
    `Missing or insufficient permissions for client referral Firestore access (${operation}). Use backend-owned referral APIs instead.`
  );
}

const envConfig = loadEnvConfig();

const firebaseConfig = {
  apiKey: envConfig.firebaseApiKey,
  authDomain: "whale-strategy.firebaseapp.com",
  projectId: "whale-strategy",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Legacy referral Firestore helpers are intentionally blocked.
export async function sendReferralData(walletAddress: string) {
  blockedReferralClientAccess("legacyFirebase:sendReferralData");
}

export async function getReferralData(
  startTime: number,
  endTime: number,
  referralCode: string | null,
  walletAddress: string | null,
  isNewUser: boolean | null,
  selectedNetworks: number[],
): Promise<ReferralData[]> {
  blockedReferralClientAccess("legacyFirebase:getReferralData");
}

// Non-referral helpers remain unchanged.
export async function sendStakeRealTxnHash(realTxnHash: string, internalTxnHash: string) {
  try {
    const ref = doc(db, "stakeRealTxnHashes", internalTxnHash);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      throw new Error(`Internal transactionHash ${internalTxnHash} already exists in stakeRealTxnHashes.`);
    } else {
      await setDoc(ref, {
        realTxnHash: realTxnHash,
      });
    }
  } catch (error) {
    console.error("Error storing stake realTxnHash:", error);
  }
}

export async function getStakeRealTxnHash(internalTxnHash: string): Promise<string | null> {
  try {
    const ref = doc(db, "stakeRealTxnHashes", internalTxnHash);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return data.realTxnHash || null;
    } else {
      throw new Error(`Internal transactionHash ${internalTxnHash} does not exist in stakeRealTxnHashes.`);
    }
  } catch (error) {
    console.error("Error fetching stake realTxnHash:", error);
    return null;
  }
}
