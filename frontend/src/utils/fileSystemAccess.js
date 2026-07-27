/**
 * File System Access API utilities for Snitch PWA
 * Handles file uploads, chat log exports, and local draft saving
 */

/**
 * Check if File System Access API is supported
 */
export const isFileSystemAccessSupported = () => {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
};

/**
 * Open a file picker for image/file upload
 * @param {Object} options - File picker options
 * @returns {Promise<File>} Selected file
 */
export const openFilePicker = async (options = {}) => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  const defaultOptions = {
    multiple: false,
    types: [
      {
        description: 'Images',
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        }
      },
      {
        description: 'Videos',
        accept: {
          'video/*': ['.mp4', '.webm', '.mov']
        }
      },
      {
        description: 'Documents',
        accept: {
          'application/pdf': ['.pdf'],
          'text/plain': ['.txt']
        }
      }
    ]
  };

  const pickerOptions = { ...defaultOptions, ...options };

  try {
    const [fileHandle] = await window.showOpenFilePicker(pickerOptions);
    const file = await fileHandle.getFile();
    return file;
  } catch (error) {
    if (error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
};

/**
 * Save chat log as .txt file
 * @param {string} content - Chat log content
 * @param {string} filename - Suggested filename
 * @returns {Promise<void>}
 */
export const saveChatLog = async (content, filename = 'snitch-chat-log.txt') => {
  if (!isFileSystemAccessSupported()) {
    // Fallback: download via blob
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'Text File',
          accept: { 'text/plain': ['.txt'] }
        }
      ]
    });

    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    if (error.name === 'AbortError') {
      return; // User cancelled
    }
    throw error;
  }
};

/**
 * Save draft locally using File System Access API
 * @param {string} content - Draft content
 * @param {string} filename - Suggested filename
 * @returns {Promise<FileSystemFileHandle>} File handle for the saved draft
 */
export const saveDraft = async (content, filename = 'snitch-draft.txt') => {
  if (!isFileSystemAccessSupported()) {
    // Fallback: save to localStorage
    const draftKey = `snitch-draft-${Date.now()}`;
    localStorage.setItem(draftKey, content);
    return null;
  }

  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'Text File',
          accept: { 'text/plain': ['.txt'] }
        }
      ]
    });

    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    return fileHandle;
  } catch (error) {
    if (error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
};

/**
 * Load draft from local file
 * @returns {Promise<string>} Draft content
 */
export const loadDraft = async () => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Text File',
          accept: { 'text/plain': ['.txt'] }
        }
      ]
    });

    const file = await fileHandle.getFile();
    const content = await file.text();
    return content;
  } catch (error) {
    if (error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
};

/**
 * Format chat messages for export
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @returns {string} Formatted chat log
 */
export const formatChatLog = (messages, currentUser) => {
  const lines = [
    'Snitch Chat Log',
    `Exported: ${new Date().toLocaleString()}`,
    '========================================',
    ''
  ];

  messages.forEach((message) => {
    const timestamp = new Date(message.createdAt).toLocaleString();
    const sender = message.senderId === currentUser._id ? 'You' : message.senderName || 'Unknown';
    const text = message.text || '[Media]';
    
    lines.push(`[${timestamp}] ${sender}:`);
    lines.push(text);
    lines.push('');
  });

  return lines.join('\n');
};

/**
 * Export chat conversation as text file
 * @param {Array} messages - Array of message objects
 * @param {Object} currentUser - Current user object
 * @param {string} conversationName - Name of the conversation
 */
export const exportChatConversation = async (messages, currentUser, conversationName = 'chat') => {
  const filename = `snitch-${conversationName}-${Date.now()}.txt`;
  const content = formatChatLog(messages, currentUser);
  await saveChatLog(content, filename);
};
