// Message Reactions System
// 消息反应系统

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👎'];

// Store reactions in localStorage
const REACTIONS_STORAGE_KEY = 'nodecrypt_message_reactions';

// Get reactions for a message
export function getMessageReactions(messageId) {
	try {
		const reactions = JSON.parse(localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}');
		return reactions[messageId] || {};
	} catch (e) {
		console.error('Error reading reactions:', e);
		return {};
	}
}

// Add reaction to a message
export function addReaction(messageId, emoji, userName) {
	try {
		const reactions = JSON.parse(localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}');
		if (!reactions[messageId]) {
			reactions[messageId] = {};
		}
		if (!reactions[messageId][emoji]) {
			reactions[messageId][emoji] = [];
		}
		// Check if user already reacted
		if (!reactions[messageId][emoji].includes(userName)) {
			reactions[messageId][emoji].push(userName);
		}
		localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
		return reactions[messageId];
	} catch (e) {
		console.error('Error adding reaction:', e);
		return {};
	}
}

// Remove reaction from a message
export function removeReaction(messageId, emoji, userName) {
	try {
		const reactions = JSON.parse(localStorage.getItem(REACTIONS_STORAGE_KEY) || '{}');
		if (reactions[messageId] && reactions[messageId][emoji]) {
			reactions[messageId][emoji] = reactions[messageId][emoji].filter(u => u !== userName);
			// Remove emoji if no users
			if (reactions[messageId][emoji].length === 0) {
				delete reactions[messageId][emoji];
			}
			// Remove message if no reactions
			if (Object.keys(reactions[messageId]).length === 0) {
				delete reactions[messageId];
			}
		}
		localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
		return reactions[messageId] || {};
	} catch (e) {
		console.error('Error removing reaction:', e);
		return {};
	}
}

// Show reaction picker
export function showReactionPicker(messageElement, messageId, userName) {
	// Remove existing picker
	const existingPicker = document.querySelector('.reaction-picker');
	if (existingPicker) {
		existingPicker.remove();
	}

	const picker = document.createElement('div');
	picker.className = 'reaction-picker';
	picker.innerHTML = REACTIONS.map(emoji => 
		`<button class="reaction-emoji" data-emoji="${emoji}">${emoji}</button>`
	).join('');

	// Position picker
	const rect = messageElement.getBoundingClientRect();
	picker.style.position = 'absolute';
	picker.style.top = `${rect.bottom + 5}px`;
	picker.style.left = `${rect.left}px`;
	picker.style.zIndex = '1000';

	document.body.appendChild(picker);

	// Handle emoji click
	picker.querySelectorAll('.reaction-emoji').forEach(btn => {
		btn.addEventListener('click', () => {
			const emoji = btn.dataset.emoji;
			const currentReactions = getMessageReactions(messageId);
			const userReacted = currentReactions[emoji]?.includes(userName);
			
			if (userReacted) {
				removeReaction(messageId, emoji, userName);
			} else {
				addReaction(messageId, emoji, userName);
			}
			
			updateMessageReactions(messageElement, messageId, userName);
			picker.remove();
		});
	});

	// Close picker when clicking outside
	setTimeout(() => {
		document.addEventListener('click', function closePicker(e) {
			if (!picker.contains(e.target)) {
				picker.remove();
				document.removeEventListener('click', closePicker);
			}
		});
	}, 0);

	return picker;
}

// Update message reactions display
export function updateMessageReactions(messageElement, messageId, userName) {
	const reactions = getMessageReactions(messageId);
	const reactionsContainer = messageElement.querySelector('.message-reactions');
	
	if (!reactionsContainer) {
		// Create reactions container if it doesn't exist
		const newContainer = document.createElement('div');
		newContainer.className = 'message-reactions';
		messageElement.appendChild(newContainer);
		updateMessageReactions(messageElement, messageId, userName);
		return;
	}

	reactionsContainer.innerHTML = '';
	
	Object.entries(reactions).forEach(([emoji, users]) => {
		const reactionBtn = document.createElement('button');
		reactionBtn.className = 'reaction-btn';
		const isReacted = users.includes(userName);
		reactionBtn.classList.toggle('reacted', isReacted);
		reactionBtn.innerHTML = `${emoji} <span class="reaction-count">${users.length}</span>`;
		
		reactionBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			if (isReacted) {
				removeReaction(messageId, emoji, userName);
			} else {
				addReaction(messageId, emoji, userName);
			}
			updateMessageReactions(messageElement, messageId, userName);
		});
		
		reactionsContainer.appendChild(reactionBtn);
	});
}

// Add reaction button to message
export function addReactionButton(messageElement, messageId, userName) {
	const actionBar = messageElement.querySelector('.message-action-bar');
	if (!actionBar) return;

	const reactionBtn = document.createElement('button');
	reactionBtn.className = 'message-action-btn reaction-trigger';
	reactionBtn.innerHTML = '😊';
	reactionBtn.title = '添加反应';
	
	reactionBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		showReactionPicker(messageElement, messageId, userName);
	});
	
	actionBar.appendChild(reactionBtn);
}
