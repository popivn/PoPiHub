import { firebaseConfig } from './firebase.config';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export async function firestoreGet(collection: string): Promise<any[]> {
  const url = `${FIRESTORE_BASE}/${collection}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Firestore GET ${collection} failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc: any) => {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(doc.fields || {})) {
      fields[key] = unwrapValue(value as any);
    }
    return { id: doc.name.split('/').pop(), ...fields };
  });
}

export async function firestoreGetDoc(collection: string, docId: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Firestore GET ${collection}/${docId} failed: ${res.status}`);
  }
  const doc = await res.json();
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(doc.fields || {})) {
    fields[key] = unwrapValue(value as any);
  }
  return { id: docId, ...fields };
}

export async function firestoreSet(collection: string, docId: string, data: Record<string, any>): Promise<void> {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}`;
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = wrapValue(value);
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Firestore SET ${collection}/${docId} failed: ${res.status}`);
  }
}

export async function firestoreWhere(collection: string, field: string, op: string, value: string): Promise<any[]> {
  const url = `${FIRESTORE_BASE}/${collection}:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: op as any,
          value: wrapValue(value),
        },
      },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) return [];
    throw new Error(`Firestore WHERE ${collection} failed: ${res.status}`);
  }
  const results = await res.json();
  if (!Array.isArray(results)) return [];
  return results
    .filter((r: any) => r.document)
    .map((r: any) => {
      const doc = r.document;
      const fields: Record<string, any> = {};
      for (const [key, val] of Object.entries(doc.fields || {})) {
        fields[key] = unwrapValue(val as any);
      }
      return { id: doc.name.split('/').pop(), ...fields };
    });
}

function wrapValue(value: any): any {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  return { stringValue: String(value) };
}

function unwrapValue(value: any): any {
  if (value.nullValue !== undefined) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  return null;
}
