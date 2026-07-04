// Message Reply System
// 消息回复系统

const REPLY_STORAGE_KEY = 'nodecrypt_message_replies';

// Get reply info for a message
export function getReplyInfo(messageId) {
	try {
		const replies = JSON.parse(localStorage.getItem(REPLY_STORAGE_KEY) || '{}');
		return replies[messageId] || null;
	} catch (e) {
		console.error('Error reading reply info:', e);
		return null;
	}
}

// Set reply info for a message
export function setReplyInfo(messageId, replyInfo) {
	try {
		const replies = JSON.parse(localStorage.getItem(REPLY_STORAGE_KEY) || '{}');
		replies[messageId] = replyInfo;
		localStorage.setItem(REPLY_STORAGE_KEY, JSON.stringify(replies));
		return true;
	} catch (e) {
		console.error('Error setting reply info:', e);
		return false;
	}
}

// Remove reply info
export function removeReplyInfo(messageId) {
	try {
		const replies = JSON.parse(localStorage.getItem(REPLY_STORAGE_KEY) || '{}');
		delete replies[messageId];
		localStorage.setItem(REPLY_STORAGE_KEY, JSON.stringify(replies));
		return true;
	} catch (e) {
		console.error('Error removing reply info:', e);
		return false;
	}
}

// Show reply preview in chat input
export function showReplyPreview(originalMessage, originalSender, messageId) {
	const chatInputArea = document.querySelector('.chat-input-area');
	
	// Remove existing reply preview
	const existingPreview = document.querySelector('.reply-preview');
	if (existingPreview) {
		existingPreview.remove();
	}

	const replyPreview = document.createElement('div');
	replyPreview.className = 'reply-preview';
	replyPreview.dataset.messageId = messageId;
	replyPreview.innerHTML = `
		<div class="reply-preview-content">
			<span class="reply-preview-sender">${originalSender}</span>
			<span class="reply-preview-text">${originalMessage.substring(0, 50)}${originalMessage.length > 50 ? '...' : ''}</span>
		</div>
		<button class="reply-preview-close">&times;</button>
	`;

	chatInputArea.insertBefore(replyPreview, chatInputArea.firstChild);

	// Handle close button
	const closeBtn = replyPreview.querySelector('.reply-preview-close');
	closeBtn.addEventListener('click', () => {
		replyPreview.remove();
	});

	return replyPreview;
}

// Remove reply preview
export function removeReplyPreview() {
	const replyPreview = document.querySelector('.reply-preview');
	if (replyPreview) {
		replyPreview.remove();
	}
}

// Add reply indicator to message
export function addReplyIndicator(messageElement, replyInfo) {
	if (!replyInfo) return;

	const replyIndicator = document.createElement('div');
	replyIndicator.className = 'reply-indicator';
	replyIndicator.innerHTML = `
		<div class="reply-indicator-bar"></div>
		<div class="reply-indicator-content">
			<span class="reply-indicator-sender">${replyInfo.sender}</span>
			<span class="reply-indicator-message">${replyInfo.message}</span>
		</div>
	`;

	messageElement.insertBefore(replyIndicator, messageElement.firstChild);
}
