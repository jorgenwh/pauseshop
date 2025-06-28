/**
 * Manages analysis sessions, mapping pause IDs to unique session IDs.
 */
import { v4 as uuidv4 } from "uuid";
import { endSession as apiEndSession } from "./api-client";

class SessionManager {
    private sessionMap: Map<string, string>;

    constructor() {
        this.sessionMap = new Map();
    }

    /**
     * Starts a new session by generating a UUID and associating it with a pause ID.
     * @param pauseId The pause ID to associate with the new session.
     * @returns The newly created session ID.
     */
    startSession(pauseId: string): string {
        const sessionId = uuidv4();
        this.sessionMap.set(pauseId, sessionId);
        console.log(`[PauseShop:SessionManager] Session started: ${sessionId} for pauseId: ${pauseId}`);
        return sessionId;
    }

    /**
     * Retrieves the session ID for a given pause ID.
     * @param pauseId The pause ID to look up.
     * @returns The session ID, or undefined if not found.
     */
    getSessionId(pauseId: string): string | undefined {
        return this.sessionMap.get(pauseId);
    }

    /**
     * Ends a session, clears it from the map, and notifies the server.
     * @param pauseId The pause ID of the session to end.
     */
    async endSession(pauseId: string): Promise<void> {
        const sessionId = this.sessionMap.get(pauseId);
        if (sessionId) {
            this.sessionMap.delete(pauseId);
            console.log(`[PauseShop:SessionManager] Session ended: ${sessionId} for pauseId: ${pauseId}`);
            try {
                await apiEndSession(sessionId);
            } catch (error) {
                console.error(`[PauseShop:SessionManager] Failed to notify server of session end for sessionId: ${sessionId}`, error);
            }
        }
    }
}

export const sessionManager = new SessionManager();