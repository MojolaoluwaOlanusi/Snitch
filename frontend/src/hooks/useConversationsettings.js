import { useState, useCallback } from 'react';

const SETTINGS_KEY = 'snitch_conversation_settings';

function loadAllSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAllSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useConversationSettings(conversationId, authUserId) {
    const [settings, setSettings] = useState(() => {
        const all = loadAllSettings();
        return all[conversationId]?.[authUserId] || {};
    });

    const updateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            // Persist
            const all = loadAllSettings();
            if (!all[conversationId]) all[conversationId] = {};
            all[conversationId][authUserId] = newSettings;
            saveAllSettings(all);
            return newSettings;
        });
    }, [conversationId, authUserId]);

    return [settings, updateSetting];
}