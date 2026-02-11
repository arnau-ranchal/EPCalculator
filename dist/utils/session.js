import { createHash, randomBytes } from 'crypto';
export function generateSessionId() {
    const timestamp = Date.now().toString();
    const random = randomBytes(16).toString('hex');
    return createHash('sha256').update(timestamp + random).digest('hex').substring(0, 32);
}
export function validateSessionId(sessionId) {
    return /^[a-f0-9]{32}$/.test(sessionId);
}
//# sourceMappingURL=session.js.map