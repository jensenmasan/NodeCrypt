// Room management logic for NodeCrypt web client
// NodeCrypt 网页客户端的房间管理逻辑

import {
	createAvatarSVG
} from './util.avatar.js';
import {
	renderChatArea,
	addSystemMsg,
	updateChatInputStyle
} from './chat.js';
import {
	renderMainHeader,
	renderUserList
} from './ui.js';
import {
	escapeHTML
} from './util.string.js';
import {
	$id,
	createElement
} from './util.dom.js';
import { t, getCurrentLanguage } from './util.i18n.js';
let roomsData = [];
let activeRoomIndex = -1;

// Get a new room data object
// 获取一个新的房间数据对象
export function getNewRoomData() {
	return {
		roomName: '',
		userList: [],
		userMap: {},
		myId: null,
		myUserName: '',
		chat: null,
		messages: [],
		prevUserList: [],
		knownUserIds: new Set(),
		unreadCount: 0,
		privateChatTargetId: null,
		privateChatTargetName: null
	}
}

// Switch to another room by index
// 切换到指定索引的房间
export function switchRoom(index) {
	if (index < 0 || index >= roomsData.length) return;
	activeRoomIndex = index;
	const rd = roomsData[index];
	if (typeof rd.unreadCount === 'number') rd.unreadCount = 0;
	const sidebarUsername = document.getElementById('sidebar-username');
	if (sidebarUsername) sidebarUsername.textContent = rd.myUserName;
	setSidebarAvatar(rd.myUserName);
	renderRooms(index);
	renderMainHeader();
	renderUserList(false);
	renderChatArea();
	updateChatInputStyle()
}

// Set the sidebar avatar
// 设置侧边栏头像
export function setSidebarAvatar(userName) {
	if (!userName) return;
	const svg = createAvatarSVG(userName);
	const el = $id('sidebar-user-avatar');
	if (el) {
		const cleanSvg = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
		el.innerHTML = cleanSvg
	}
}

// Render the room list
// 渲染房间列表
export function renderRooms(activeId = 0) {
	const roomList = $id('room-list');
	roomList.innerHTML = '';
	roomsData.forEach((rd, i) => {
		const div = createElement('div', {
			class: 'room' + (i === activeId ? ' active' : ''),
			onclick: () => switchRoom(i)
		});
		const safeRoomName = escapeHTML(rd.roomName);
		let unreadHtml = '';
		if (rd.unreadCount && i !== activeId) {
			unreadHtml = `<span class="room-unread-badge">${rd.unreadCount > 99 ? '99+' : rd.unreadCount}</span>`
		}
		div.innerHTML = `<div class="info"><div class="title">#${safeRoomName}</div></div>${unreadHtml}`;
		roomList.appendChild(div)
	})
}

// Join a room
// 加入一个房间
export function joinRoom(userName, roomName, password, modal = null, onResult) {
	const newRd = getNewRoomData();
	newRd.roomName = roomName;
	newRd.myUserName = userName;
	newRd.password = password;
	roomsData.push(newRd);
	const idx = roomsData.length - 1;
	switchRoom(idx);
	const sidebarUsername = $id('sidebar-username');
	if (sidebarUsername) sidebarUsername.textContent = userName;
	setSidebarAvatar(userName);
	let closed = false;
	const callbacks = {
		onServerClosed: () => {
			setStatus('Node connection closed');
			if (onResult && !closed) {
				closed = true;
				onResult(false)
			}
		}, onServerSecured: () => {
			if (modal) modal.remove();
			else {
				const loginContainer = $id('login-container');
				if (loginContainer) loginContainer.style.display = 'none';
				const chatContainer = $id('chat-container');
				if (chatContainer) chatContainer.style.display = '';

				// 清理3D背景系统
				if (typeof window.cleanup3DGestureSystem === 'function') {
					window.cleanup3DGestureSystem();
				}
			}
			if (onResult && !closed) {
				closed = true;
				onResult(true)
			}
			addSystemMsg(t('system.secured', 'connection secured'))
		},
		onClientSecured: (user) => handleClientSecured(idx, user),
		onClientList: (list, selfId) => handleClientList(idx, list, selfId),
		onClientLeft: (clientId) => handleClientLeft(idx, clientId),
		onClientMessage: (msg) => handleClientMessage(idx, msg)
	};
	const chatInst = new window.NodeCrypt(window.config, callbacks);
	chatInst.setCredentials(userName, roomName, password);
	chatInst.connect();
	roomsData[idx].chat = chatInst
}

// Handle the client list update
// 处理客户端列表更新
export function handleClientList(idx, list, selfId) {
	const rd = roomsData[idx];
	if (!rd) return;
	const oldUserIds = new Set((rd.userList || []).map(u => u.clientId));
	const newUserIds = new Set(list.map(u => u.clientId));
	for (const oldId of oldUserIds) {
		if (!newUserIds.has(oldId)) {
			handleClientLeft(idx, oldId)
		}
	}
	rd.userList = list;
	rd.userMap = {};
	list.forEach(u => {
		rd.userMap[u.clientId] = u
	});
	rd.myId = selfId;
	if (activeRoomIndex === idx) {
		renderUserList(false);
		renderMainHeader()
	}
	rd.initCount = (rd.initCount || 0) + 1;
	if (rd.initCount === 2) {
		rd.isInitialized = true;
		rd.knownUserIds = new Set(list.map(u => u.clientId))
	}
}

// Handle client secured event
// 处理客户端安全连接事件
export function handleClientSecured(idx, user) {
	const rd = roomsData[idx];
	if (!rd) return;
	rd.userMap[user.clientId] = user;
	const existingUserIndex = rd.userList.findIndex(u => u.clientId === user.clientId);
	if (existingUserIndex === -1) {
		rd.userList.push(user)
	} else {
		rd.userList[existingUserIndex] = user
	}
	if (activeRoomIndex === idx) {
		renderUserList(false);
		renderMainHeader()
	}
	if (!rd.isInitialized) {
		return
	}
	const isNew = !rd.knownUserIds.has(user.clientId);
	if (isNew) {
		rd.knownUserIds.add(user.clientId); const name = user.userName || user.username || user.name || t('ui.anonymous', 'Anonymous');
		const msg = `${name} ${t('system.joined', 'joined the conversation')}`;
		rd.messages.push({
			type: 'system',
			text: msg
		});
		if (activeRoomIndex === idx) addSystemMsg(msg, true);
		if (window.notifyMessage) {
			window.notifyMessage(rd.roomName, 'system', msg)
		}
	}
}

// Handle client left event
// 处理客户端离开事件
export function handleClientLeft(idx, clientId) {
	const rd = roomsData[idx];
	if (!rd) return;
	if (rd.privateChatTargetId === clientId) {
		rd.privateChatTargetId = null;
		rd.privateChatTargetName = null;
		if (activeRoomIndex === idx) {
			updateChatInputStyle()
		}
	}
	const user = rd.userMap[clientId];
	const name = user ? (user.userName || user.username || user.name || 'Anonymous') : 'Anonymous';
	const msg = `${name} ${t('system.left', 'left the conversation')}`;
	rd.messages.push({
		type: 'system',
		text: msg
	});
	if (activeRoomIndex === idx) addSystemMsg(msg, true);
	rd.userList = rd.userList.filter(u => u.clientId !== clientId);
	delete rd.userMap[clientId];
	if (activeRoomIndex === idx) {
		renderUserList(false);
		renderMainHeader()
	}
}

// Handle client message event
// 处理客户端消息事件
export function handleClientMessage(idx, msg) {
	const newRd = roomsData[idx];
	if (!newRd) return;

	// Prevent processing own messages unless it's a private message sent to oneself
	if (msg.clientId === newRd.myId && msg.userName === newRd.myUserName && !msg.type.includes('_private')) {
		return;
	}

	let msgType = msg.type || 'text';

	// Handle WebRTC call signals
	// 处理 WebRTC 通话信号
	if (msgType === 'call_signal') {
		if (window.handleWebRTCSignal) {
			window.handleWebRTCSignal(msg.clientId, msg.data);
		}
		return; // Signal messages are not displayed in chat
	}

	// Handle Effects Signals
	if (msgType && msgType.endsWith('_signal') && !msgType.startsWith('call_')) {
		// Identify effect
		const effectType = msgType.replace('_signal', '');

		// Convert snake_case to CamelCase for function name: startSnakeCase -> startSnakeCase
		// Actually our convention is startStarrySky (CamelCase)
		const pascalCase = effectType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
		const funcName = 'start' + pascalCase;

		const triggerFunc = window[funcName];

		if (typeof triggerFunc === 'function') {
			triggerFunc();

			// Optional: Add a system message saying who sent it
			let senderName = msg.userName;
			if (!senderName && msg.clientId && newRd.userMap[msg.clientId]) {
				senderName = newRd.userMap[msg.clientId].userName || 'Someone';
			}
			const lang = getCurrentLanguage() || 'en';
			let actionText = '';
			let effectDisplayName = effectType;
			let icon = '✨';

			// Icon mapping
			const iconMap = {
				fireworks: '🎆', starry_sky: '🌌', confetti: '🎊',
				hearts: '❤', bubbles: '🫧', snow: '❄',
				rain: '🌧', sakura: '🌸', lightning: '⚡', matrix: '💻',
				stress_relief: '💥', new_year: '🧧'
			};
			if (iconMap[effectType]) icon = iconMap[effectType];

			// Display Name mapping
			const nameMap = {
				fireworks: ['Fireworks', '烟花'],
				starry_sky: ['Galaxy', '星空'],
				confetti: ['Celebration', '庆典'],
				hearts: ['Love', '爱心'],
				bubbles: ['Bubbles', '气泡'],
				snow: ['Snow', '下雪'],
				rain: ['Rain', '下雨'],
				sakura: ['Sakura', '樱花'],
				lightning: ['Lightning', '闪电'],
				matrix: ['Matrix', '代码雨'],
				stress_relief: ['Destruction', '解压'],
				new_year: ['Happy New Year', '新年快乐'],
				nudge: ['Nudged', '拍一拍']  // Add nudge mapping
			};


			if (lang === 'zh') {
				actionText = '展示了';
				if (effectType === 'fireworks') actionText = '燃放了';
				if (effectType === 'lightning') actionText = '召唤了';
				if (effectType === 'rain' || effectType === 'snow') actionText = '让天';

				// Nudge handling
				if (effectType === 'nudge') {
					actionText = '拍了拍';
					const targetId = msg.data ? msg.data.targetId : null;
					const targetName = msg.data ? msg.data.targetName : null;
					if (targetId === newRd.myId) {
						effectDisplayName = '我';
						// Trigger shake effect for me
						setTimeout(() => {
							const chatContainer = document.querySelector('.main');
							if (chatContainer) {
								chatContainer.classList.add('nudge-shake');
								setTimeout(() => chatContainer.classList.remove('nudge-shake'), 500);
							}
						}, 100);
					} else if (targetName) {
						effectDisplayName = targetName;
					} else {
						effectDisplayName = '某人';
					}
					// Private chat special case
					if (msg.data && msg.data.from) {
						// It's a private nudge
						effectDisplayName = '我';
						setTimeout(() => {
							const chatContainer = document.querySelector('.main');
							if (chatContainer) {
								chatContainer.classList.add('nudge-shake');
								setTimeout(() => chatContainer.classList.remove('nudge-shake'), 500);
							}
						}, 100);
					}
					icon = '👋';
				} else if (nameMap[effectType]) {
					effectDisplayName = nameMap[effectType][1];
				}
			} else {
				actionText = 'triggered';
				if (effectType === 'nudge') {
					actionText = 'nudged';
					const targetId = msg.data ? msg.data.targetId : null;
					const targetName = msg.data ? msg.data.targetName : null;
					if (targetId === newRd.myId) {
						effectDisplayName = 'me';
						// Trigger shake
						setTimeout(() => {
							const chatContainer = document.querySelector('.main');
							if (chatContainer) {
								chatContainer.classList.add('nudge-shake');
								setTimeout(() => chatContainer.classList.remove('nudge-shake'), 500);
							}
						}, 100);
					} else if (targetName) {
						effectDisplayName = targetName;
					} else {
						effectDisplayName = 'someone';
					}
					// Private chat special case
					if (msg.data && msg.data.from) {
						effectDisplayName = 'me';
						// Trigger shake
						setTimeout(() => {
							const chatContainer = document.querySelector('.main');
							if (chatContainer) {
								chatContainer.classList.add('nudge-shake');
								setTimeout(() => chatContainer.classList.remove('nudge-shake'), 500);
							}
						}, 100);
					}
					icon = '👋';
				} else if (nameMap[effectType]) {
					effectDisplayName = nameMap[effectType][0];
				}
			}

			let text = `${senderName} ${actionText} ${effectDisplayName} ${icon}`;

			// If it's a nudge, format slightly differently
			if (effectType === 'nudge') {
				text = `${senderName} ${actionText} ${effectDisplayName} ${icon}`;
			}

			// Let's add it locally only to the chat
			if (activeRoomIndex === idx && window.addSystemMsg) {
				window.addSystemMsg(text);
			} else {
				// Push to history?
				newRd.messages.push({
					type: 'system',
					text: text,
					timestamp: Date.now()
				});
				if (activeRoomIndex !== idx) {
					newRd.unreadCount = (newRd.unreadCount || 0) + 1;
					renderRooms(activeRoomIndex);
				}
			}
		}
		return;
	}

	// Handle file messages
	if (msgType.startsWith('file_')) {
		// Part 1: Update message history and send notifications (for 'file_start' type)
		if (msgType === 'file_start' || msgType === 'file_start_private') {
			let realUserName = msg.userName;
			if (!realUserName && msg.clientId && newRd.userMap[msg.clientId]) {
				realUserName = newRd.userMap[msg.clientId].userName || newRd.userMap[msg.clientId].username || newRd.userMap[msg.clientId].name;
			}
			const historyMsgType = msgType === 'file_start_private' ? 'file_private' : 'file';

			const fileId = msg.data && msg.data.fileId;
			if (fileId) { // Only proceed if we have a fileId
				const messageAlreadyInHistory = newRd.messages.some(
					m => m.msgType === historyMsgType && m.text && m.text.fileId === fileId && m.userName === realUserName
				);

				if (!messageAlreadyInHistory) {
					newRd.messages.push({
						type: 'other',
						text: msg.data, // This is the file metadata object
						userName: realUserName,
						avatar: realUserName,
						msgType: historyMsgType,
						timestamp: (msg.data && msg.data.timestamp) || Date.now()
					});
				}
			}

			const notificationMsgType = msgType.includes('_private') ? 'private file' : 'file';
			if (window.notifyMessage && msg.data && msg.data.fileName) {
				window.notifyMessage(newRd.roomName, notificationMsgType, `${msg.data.fileName}`, realUserName);
			}
		}

		// Part 2: Handle UI interaction (rendering in active room, or unread count in inactive room)
		if (activeRoomIndex === idx) {
			// If it's the active room, delegate to util.file.js to handle UI and file transfer state.
			// This applies to all file-related messages (file_start, file_volume, file_end, etc.)
			if (window.handleFileMessage) {
				window.handleFileMessage(msg.data, msgType.includes('_private'));
			}
		} else {
			// If it's not the active room, only increment unread count for 'file_start' messages.
			if (msgType === 'file_start' || msgType === 'file_start_private') {
				newRd.unreadCount = (newRd.unreadCount || 0) + 1;
				renderRooms(activeRoomIndex);
			}
		}
		return; // File messages are fully handled.
	}

	// Handle image messages (both new and legacy formats)
	if (msgType === 'image' || msgType === 'image_private') {
		// Already has correct type
	} else if (!msgType.includes('_private')) {
		// Handle legacy image detection
		if (msg.data && typeof msg.data === 'string' && msg.data.startsWith('data:image/')) {
			msgType = 'image';
		} else if (msg.data && typeof msg.data === 'object' && msg.data.image) {
			msgType = 'image';
		}
	}
	let realUserName = msg.userName;
	if (!realUserName && msg.clientId && newRd.userMap[msg.clientId]) {
		realUserName = newRd.userMap[msg.clientId].userName || newRd.userMap[msg.clientId].username || newRd.userMap[msg.clientId].name;
	}

	// Add message to messages array for chat history
	roomsData[idx].messages.push({
		type: 'other',
		text: msg.data,
		userName: realUserName,
		avatar: realUserName,
		msgType: msgType,
		timestamp: Date.now()
	});

	// Only add message to chat display if it's for the active room
	if (activeRoomIndex === idx) {
		if (window.addOtherMsg) {
			window.addOtherMsg(msg.data, realUserName, realUserName, false, msgType);
		}
	} else {
		roomsData[idx].unreadCount = (roomsData[idx].unreadCount || 0) + 1;
		renderRooms(activeRoomIndex);
	}

	const notificationMsgType = msgType.includes('_private') ? `private ${msgType.split('_')[0]}` : msgType;
	if (window.notifyMessage) {
		window.notifyMessage(newRd.roomName, notificationMsgType, msg.data, realUserName);
	}
}

// Toggle private chat with a user
// 切换与某用户的私聊
export function togglePrivateChat(targetId, targetName) {
	const rd = roomsData[activeRoomIndex];
	if (!rd) return;
	if (rd.privateChatTargetId === targetId) {
		rd.privateChatTargetId = null;
		rd.privateChatTargetName = null
	} else {
		rd.privateChatTargetId = targetId;
		rd.privateChatTargetName = targetName
	}
	renderUserList();
	renderMainHeader();
	updateChatInputStyle()
}


// Exit the current room
// 退出当前房间
export function exitRoom() {
	if (activeRoomIndex >= 0 && roomsData[activeRoomIndex]) {
		const chatInst = roomsData[activeRoomIndex].chat;
		if (chatInst && typeof chatInst.destruct === 'function') {
			chatInst.destruct()
		} else if (chatInst && typeof chatInst.disconnect === 'function') {
			chatInst.disconnect()
		}
		roomsData[activeRoomIndex].chat = null;
		roomsData.splice(activeRoomIndex, 1);
		if (roomsData.length > 0) {
			switchRoom(0);
			return true
		} else {
			return false
		}
	}
	return false
}

export { roomsData, activeRoomIndex };

// Listen for sidebar username update event
// 监听侧边栏用户名更新事件
window.addEventListener('updateSidebarUsername', () => {
	if (activeRoomIndex >= 0 && roomsData[activeRoomIndex]) {
		const rd = roomsData[activeRoomIndex];
		const sidebarUsername = document.getElementById('sidebar-username');
		if (sidebarUsername && rd.myUserName) {
			sidebarUsername.textContent = rd.myUserName;
		}
		// Also update the avatar to ensure consistency
		if (rd.myUserName) {
			setSidebarAvatar(rd.myUserName);
		}
	}
});