import { ObjectId } from "mongodb";
import { db } from "../config/mongo-client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "customer" | "provider" | "admin";
  banned: boolean;
  provider?: {
    bio?: string;
    verified: boolean;
  };
  savedServices?: string[];
}

export const userHelper = {
  /**
   * Find a user by their Better Auth ID
   */
  async findById(id: string): Promise<UserProfile | null> {
    const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
    const userDoc = await db.collection("user").findOne({ _id: queryId as any });
    if (!userDoc) return null;
    return this.mapUserDoc(userDoc);
  },

  /**
   * Find a user by their email
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    const userDoc = await db.collection("user").findOne({ email: email.toLowerCase() });
    if (!userDoc) return null;
    return this.mapUserDoc(userDoc);
  },

  /**
   * Find multiple users by their IDs
   */
  async findManyByIds(ids: string[]): Promise<UserProfile[]> {
    const queryIds = ids.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
    const docs = await db.collection("user").find({ _id: { $in: queryIds as any } }).toArray();
    return docs.map(doc => this.mapUserDoc(doc));
  },

  /**
   * Update extra fields or standard profile fields on user
   */
  async updateProfile(id: string, updates: Partial<Omit<UserProfile, "id">>): Promise<boolean> {
    const updatePayload: any = {};
    
    // Better Auth fields
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.avatarUrl !== undefined) updatePayload.image = updates.avatarUrl; // Maps avatarUrl to image in Better Auth
    if (updates.role !== undefined) updatePayload.role = updates.role;
    
    // App-specific extra fields
    if (updates.banned !== undefined) updatePayload.banned = updates.banned;
    if (updates.provider !== undefined) {
      if (updates.provider.bio !== undefined) updatePayload.providerBio = updates.provider.bio;
      if (updates.provider.verified !== undefined) updatePayload.providerVerified = updates.provider.verified;
    }
    if (updates.savedServices !== undefined) updatePayload.savedServices = updates.savedServices;

    if (Object.keys(updatePayload).length === 0) return true;

    const queryId = ObjectId.isValid(id) ? new ObjectId(id) : id;
    const result = await db.collection("user").updateOne(
      { _id: queryId as any },
      { $set: updatePayload }
    );
    return result.modifiedCount > 0;
  },

  /**
   * Map raw Better Auth user document from collection to application UserProfile
   */
  mapUserDoc(doc: any): UserProfile {
    return {
      id: doc._id?.toString() || doc.id?.toString(),
      name: doc.name,
      email: doc.email,
      avatarUrl: doc.image || undefined,
      role: (doc.role as "customer" | "provider" | "admin") || "customer",
      banned: !!doc.banned,
      provider: doc.providerBio || doc.providerVerified !== undefined ? {
        bio: doc.providerBio || "",
        verified: !!doc.providerVerified,
      } : undefined,
      savedServices: doc.savedServices || [],
    };
  }
};
