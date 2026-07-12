"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHelper = void 0;
const mongo_client_1 = require("../config/mongo-client");
exports.userHelper = {
    /**
     * Find a user by their Better Auth ID
     */
    async findById(id) {
        const userDoc = await mongo_client_1.db.collection("user").findOne({ _id: id });
        if (!userDoc)
            return null;
        return this.mapUserDoc(userDoc);
    },
    /**
     * Find a user by their email
     */
    async findByEmail(email) {
        const userDoc = await mongo_client_1.db.collection("user").findOne({ email: email.toLowerCase() });
        if (!userDoc)
            return null;
        return this.mapUserDoc(userDoc);
    },
    /**
     * Find multiple users by their IDs
     */
    async findManyByIds(ids) {
        const docs = await mongo_client_1.db.collection("user").find({ _id: { $in: ids } }).toArray();
        return docs.map(doc => this.mapUserDoc(doc));
    },
    /**
     * Update extra fields or standard profile fields on user
     */
    async updateProfile(id, updates) {
        const updatePayload = {};
        // Better Auth fields
        if (updates.name !== undefined)
            updatePayload.name = updates.name;
        if (updates.avatarUrl !== undefined)
            updatePayload.image = updates.avatarUrl; // Maps avatarUrl to image in Better Auth
        if (updates.role !== undefined)
            updatePayload.role = updates.role;
        // App-specific extra fields
        if (updates.banned !== undefined)
            updatePayload.banned = updates.banned;
        if (updates.provider !== undefined) {
            if (updates.provider.bio !== undefined)
                updatePayload.providerBio = updates.provider.bio;
            if (updates.provider.verified !== undefined)
                updatePayload.providerVerified = updates.provider.verified;
        }
        if (updates.savedServices !== undefined)
            updatePayload.savedServices = updates.savedServices;
        if (Object.keys(updatePayload).length === 0)
            return true;
        const result = await mongo_client_1.db.collection("user").updateOne({ _id: id }, { $set: updatePayload });
        return result.modifiedCount > 0;
    },
    /**
     * Map raw Better Auth user document from collection to application UserProfile
     */
    mapUserDoc(doc) {
        return {
            id: doc._id || doc.id,
            name: doc.name,
            email: doc.email,
            avatarUrl: doc.image || undefined,
            role: doc.role || "customer",
            banned: !!doc.banned,
            provider: doc.providerBio || doc.providerVerified !== undefined ? {
                bio: doc.providerBio || "",
                verified: !!doc.providerVerified,
            } : undefined,
            savedServices: doc.savedServices || [],
        };
    }
};
