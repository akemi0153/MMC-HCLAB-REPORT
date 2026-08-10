import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, testConnection, handleFirestoreError, OperationType, loginWithGoogle, logoutUser, loginWithEmail } from '../lib/firebase';
import { WardOccupancy, HCORDER, JsonQuerySchema } from '../types';
import { INITIAL_WARDS, MOCK_ORDERS } from '../data/mockCensusData';
import { DEFAULT_JSON_SCHEMAS } from '../data/jsonSchemas';

const cleanPayload = (obj: any) => JSON.parse(JSON.stringify(obj));

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [wards, setWards] = useState<WardOccupancy[]>(INITIAL_WARDS);
  const [orders, setOrders] = useState<HCORDER[]>(MOCK_ORDERS);
  const [schemas, setSchemas] = useState<JsonQuerySchema[]>(DEFAULT_JSON_SCHEMAS);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          } else {
            // Create default user profile
            const isAutoAdmin = currentUser.email?.toLowerCase().startsWith('admin');
            const profile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              role: isAutoAdmin ? 'admin' : 'user' // auto-grant admin if username starts with admin
            };
            await setDoc(doc(db, 'users', currentUser.uid), profile);
            setUserRole(profile.role);
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setUserRole('user');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Test Firestore connection on mount
  useEffect(() => {
    testConnection().then(() => setFirestoreConnected(true));
  }, []);

  // 3. Realtime Wards Sync
  useEffect(() => {
    const path = 'wards';
    const wardsCol = collection(db, path);

    // Initial check & seed if empty
    getDocs(wardsCol).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial wards into Firestore...');
        try {
          for (const ward of INITIAL_WARDS) {
            const wardId = ward.wardName.replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(db, path, wardId), cleanPayload({
              ...ward,
              updatedAt: new Date().toISOString()
            }));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }).catch(err => {
      console.warn('Error checking initial wards collection:', err);
    });

    const unsubscribe = onSnapshot(wardsCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedWards: WardOccupancy[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedWards.push({
            wardName: data.wardName,
            department: data.department,
            totalBeds: data.totalBeds,
            occupiedBeds: data.occupiedBeds,
            reservedBeds: data.reservedBeds,
            availableBeds: data.availableBeds,
            beds: data.beds || []
          });
        });
        setWards(loadedWards);
      }
      setIsSyncing(false);
    }, (error) => {
      setSyncError(`Wards Firestore Sync Error: ${error.message}`);
      setIsSyncing(false);
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  // 4. Realtime Orders Sync
  useEffect(() => {
    const path = 'orders';
    const ordersCol = collection(db, path);

    getDocs(ordersCol).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial orders into Firestore...');
        try {
          for (const order of MOCK_ORDERS) {
            const orderId = order.labNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(db, path, orderId), cleanPayload({
              ...order,
              updatedAt: new Date().toISOString()
            }));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }).catch(err => {
      console.warn('Error checking initial orders collection:', err);
    });

    const unsubscribe = onSnapshot(ordersCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedOrders: HCORDER[] = [];
        snapshot.forEach((docSnap) => {
          loadedOrders.push(docSnap.data() as HCORDER);
        });
        setOrders(loadedOrders);
      }
    }, (error) => {
      setSyncError(`Orders Firestore Sync Error: ${error.message}`);
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  // 5. Realtime Schemas Sync
  useEffect(() => {
    const path = 'query_schemas';
    const schemasCol = collection(db, path);

    getDocs(schemasCol).then(async (snapshot) => {
      if (snapshot.empty) {
        console.log('Seeding initial query schemas into Firestore...');
        try {
          for (const schema of DEFAULT_JSON_SCHEMAS) {
            const schemaId = schema.id.replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(db, path, schemaId), cleanPayload(schema));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }).catch(err => {
      console.warn('Error checking initial schemas collection:', err);
    });

    const unsubscribe = onSnapshot(schemasCol, (snapshot) => {
      if (!snapshot.empty) {
        const loadedSchemas: JsonQuerySchema[] = [];
        snapshot.forEach((docSnap) => {
          loadedSchemas.push(docSnap.data() as JsonQuerySchema);
        });
        setSchemas(loadedSchemas);
      }
    }, (error) => {
      setSyncError(`Schemas Firestore Sync Error: ${error.message}`);
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  // Update handlers that write to Firestore & local state
  const updateWardsInFirestore = async (newWards: WardOccupancy[]) => {
    setWards(newWards);
    const path = 'wards';
    try {
      for (const ward of newWards) {
        const wardId = ward.wardName.replace(/[^a-zA-Z0-9_-]/g, '_');
        await setDoc(doc(db, path, wardId), cleanPayload({
          ...ward,
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveSchemaToFirestore = async (schema: JsonQuerySchema) => {
    setSchemas(prev => [schema, ...prev.filter(s => s.id !== schema.id)]);
    const path = 'query_schemas';
    try {
      const schemaId = schema.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      await setDoc(doc(db, path, schemaId), cleanPayload(schema));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteSchemaFromFirestore = async (schemaId: string) => {
    setSchemas(prev => prev.filter(s => s.id !== schemaId));
    const path = 'query_schemas';
    try {
      const formattedId = schemaId.replace(/[^a-zA-Z0-9_-]/g, '_');
      await deleteDoc(doc(db, path, formattedId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${schemaId}`);
    }
  };

  return {
    user,
    userRole,
    authLoading,
    firestoreConnected,
    isSyncing,
    syncError,
    wards,
    setWards: updateWardsInFirestore,
    orders,
    schemas,
    setSchemas,
    saveSchemaToFirestore,
    deleteSchemaFromFirestore,
    loginWithGoogle,
    loginWithEmail,
    logoutUser
  };
}
