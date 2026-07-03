import { useState, useEffect, useCallback } from 'react';

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
    const [settings, setSettings] = useState({});

    // Reload settings whenever conversationId or authUserId change
    useEffect(() => {
        if (conversationId && authUserId) {
            const all = loadAllSettings();
            const userSettings = all[conversationId]?.[authUserId] || {};
            setSettings(userSettings);
        }
    }, [conversationId, authUserId]);

    const updateSetting = useCallback((key, value) => {
        if (!conversationId || !authUserId) return;
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            const all = loadAllSettings();
            if (!all[conversationId]) all[conversationId] = {};
            all[conversationId][authUserId] = newSettings;
            saveAllSettings(all);
            return newSettings;
        });
    }, [conversationId, authUserId]);

    return [settings, updateSetting];
}