import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type OperatorProfile = {
  uid: string;
  operatorId: string;
  role: "operator_admin" | "operator_staff";
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export async function getCurrentOperator(): Promise<OperatorProfile | null> {
  const user = auth.currentUser;

  if (!user) return null;

  const snapshot = await getDoc(doc(db, "users", user.uid));

  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  if (
    data.role !== "operator_admin" &&
    data.role !== "operator_staff"
  ) {
    return null;
  }

  return {
    uid: user.uid,
    operatorId: data.operatorId,
    role: data.role,
    companyName: data.companyName,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    status: data.status,
  };
}