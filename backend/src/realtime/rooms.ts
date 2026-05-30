type Participant = {
    userId: string;
    socketId: string;
    joinedAt: number;
    muted?: boolean;
    videoOn?: boolean;
    role?: 'owner' | 'admin' | 'member';
};

type Room = {
    id: string;
    participants: Map<string, Participant>;
    metadata?: Record<string, any>;
};

export class RoomStore {
    private rooms: Map<string, Room> = new Map();

    createRoom(id: string, metadata?: Record<string, any>) {
        if (this.rooms.has(id)) return this.rooms.get(id)!;
        const room: Room = { id, participants: new Map(), metadata };
        this.rooms.set(id, room);
        return room;
    }

    getRoom(id: string) {
        return this.rooms.get(id);
    }

    deleteRoom(id: string) {
        return this.rooms.delete(id);
    }

    addParticipant(roomId: string, p: Participant) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.participants.set(p.userId, p);
        return p;
    }

    removeParticipant(roomId: string, userId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.participants.delete(userId);
        if (room.participants.size === 0) this.rooms.delete(roomId);
    }

    listParticipants(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return [] as Participant[];
        return Array.from(room.participants.values());
    }

    updateParticipant(roomId: string, userId: string, patch: Partial<Participant>) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        const p = room.participants.get(userId);
        if (!p) return;
        const updated = { ...p, ...patch };
        room.participants.set(userId, updated);
        return updated;
    }

    // Return array of room ids (in-memory only)
    listAllRoomIds() {
        return Array.from(this.rooms.keys());
    }
}
