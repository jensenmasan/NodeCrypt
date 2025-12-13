// 导入 NodeCrypt 模块（加密功能模块）
// Import the NodeCrypt module (used for encryption)
import './NodeCrypt.js';

// 从 util.file.js 中导入设置文件发送的函数
// Import setupFileSend function from util.file.js
import {
	setupFileSend,
	handleFileMessage,
	downloadFile
} from './util.file.js';

// 从 util.image.js 中导入图片处理功能
// Import image processing functions from util.image.js
import {
	setupImagePaste
} from './util.image.js';

// 从 util.emoji.js 中导入设置表情选择器的函数
// Import setupEmojiPicker function from util.emoji.js
import {
	setupEmojiPicker
} from './util.emoji.js';

// 从 util.settings.js 中导入设置面板的功能函数
// Import functions for settings panel from util.settings.js
import {
	openSettingsPanel,   // 打开设置面板 / Open settings panel
	closeSettingsPanel,  // 关闭设置面板 / Close settings panel
	initSettings,         // 初始化设置 / Initialize settings
	notifyMessage         // 通知信息提示 / Display notification message
} from './util.settings.js';
import { t, updateStaticTexts } from './util.i18n.js';

// 从 util.theme.js 中导入主题功能函数
// Import theme functions from util.theme.js
import {
	initTheme,            // 初始化主题 / Initialize theme
	applyTheme,           // 应用主题
	getCurrentTheme       // 获取当前主题
} from './util.theme.js';

// 从 util.dom.js 中导入常用 DOM 操作函数
// Import common DOM manipulation functions from util.dom.js
import {
	$,         // 简化的 document.querySelector / Simplified selector
	$id,       // document.getElementById 的简写 / Shortcut for getElementById
	removeClass // 移除类名 / Remove a CSS class
} from './util.dom.js';

// 从 room.js 中导入房间管理相关变量和函数
// Import room-related variables and functions from room.js
import {
	roomsData,         // 当前所有房间的数据 / Data of all rooms
	activeRoomIndex,   // 当前激活的房间索引 / Index of the active room
	joinRoom           // 加入房间的函数 / Function to join a room
} from './room.js';

// 从 chat.js 中导入聊天功能相关的函数
// Import chat-related functions from chat.js
import {
	addMsg,               // 添加普通消息到聊天窗口 / Add a normal message to chat
	addOtherMsg,          // 添加其他用户消息 / Add message from other users
	addSystemMsg,         // 添加系统消息 / Add a system message
	setupImagePreview,    // 设置图片预览功能 / Setup image preview
	setupInputPlaceholder, // 设置输入框的占位提示 / Setup placeholder for input box
	autoGrowInput         // 自动调整输入框高度 / Auto adjust input height
} from './chat.js';

// 从 ui.js 中导入 UI 界面相关的功能
// Import user interface functions from ui.js
import {
	renderUserList,       // 渲染用户列表 / Render user list
	renderMainHeader,     // 渲染主标题栏 / Render main header
	setupMoreBtnMenu,     // 设置更多按钮的下拉菜单 / Setup "more" button menu
	preventSpaceInput,    // 防止输入空格 / Prevent space input in form fields
	loginFormHandler,     // 登录表单提交处理器 / Login form handler
	openLoginModal,       // 打开登录窗口 / Open login modal
	setupTabs,            // 设置页面标签切换 / Setup tab switching
	autofillRoomPwd,      // 自动填充房间密码 / Autofill room password
	generateLoginForm,    // 生成登录表单HTML / Generate login form HTML
	initLoginForm,        // 初始化登录表单 / Initialize login form
	initFlipCard,         // 初始化翻转卡片功能 / Initialize flip card functionality
	setupContextMenu      // 设置上下文菜单 / Setup context menu
} from './ui.js';

// Import message swipe gesture functionality (replaces recall)
import { setupMessageSwipe, clearQuote } from './util.swipe.js';

// 设置全局配置参数
// Set global configuration parameters
window.config = {
	wsAddress: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`, // WebSocket 服务器地址 / WebSocket server address
	//wsAddress: `wss://crypt.works`,
	debug: true                       // 是否开启调试模式 / Enable debug mode
};

// 在文档开始加载前就初始化语言设置，防止闪烁
// Initialize language settings before document starts loading
initSettings();
updateStaticTexts();

// 把一些函数挂载到 window 对象上供其他模块使用
// Expose functions to the global window object for accessibility
window.addSystemMsg = addSystemMsg;
window.addOtherMsg = addOtherMsg;
window.joinRoom = joinRoom;
window.notifyMessage = notifyMessage;
window.setupEmojiPicker = setupEmojiPicker;
window.handleFileMessage = handleFileMessage;
window.downloadFile = downloadFile;

// Import WebRTC classes
import { WebRTCManager } from './util.webrtc.js';
import { CallUIManager } from './util.call.ui.js';

let webRTCManager;
let callUIManager;

// Initialize WebRTC
function initWebRTC() {
	webRTCManager = new WebRTCManager({
		onLocalStream: (stream) => {
			callUIManager.setLocalStream(stream);
		},
		onRemoteStream: (stream) => {
			callUIManager.setRemoteStream(stream);
		},
		onCallEnded: (reason) => {
			callUIManager.hideCallUI();
			if (reason) addSystemMsg(`${t('call.ended', 'Call ended')}: ${reason}`);
		},
		onSignal: (targetId, data) => {
			// Send signal via private message
			const rd = roomsData[activeRoomIndex];
			if (rd && rd.chat) {
				const targetClient = rd.chat.channel[targetId];
				if (targetClient && targetClient.shared) {
					// Encrypt as private message
					const clientMessagePayload = {
						a: 'm',
						t: 'call_signal', // Generic type for encryption wrapper 
						d: data
					};
					// Note: We wrap data inside 'd' and send as 'call_signal' type for the outer wrapper
					// The actual type (call_offer, etc) is inside data

					const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
					const serverRelayPayload = {
						a: 'c',
						p: encryptedClientMessage,
						c: targetId
					};
					const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);
					rd.chat.sendMessage(encryptedMessageForServer);
				}
			}
		},
		onIncomingCall: (callerId, offer, isVideo) => {
			const rd = roomsData[activeRoomIndex];
			const caller = rd.userMap[callerId];
			const callerName = caller ? (caller.userName || 'Unknown') : 'Unknown';

			// Show incoming call modal
			const modal = callUIManager.showIncomingCallModal(callerName, isVideo,
				() => { // Accept
					// Show UI first
					callUIManager.showCallUI(false, callerName, isVideo);
					webRTCManager.acceptCall(callerId, offer, isVideo);
				},
				() => { // Reject
					// Send reject signal?
					// For now simply ignore or could implemented explicit reject
					webRTCManager.endCall('Rejected');
				}
			);
		}
	});

	callUIManager = new CallUIManager(webRTCManager);

	// Expose start call function
	window.startCall = (targetId, isVideo) => {
		const rd = roomsData[activeRoomIndex];
		const targetUser = rd.userMap[targetId];
		const targetName = targetUser ? (targetUser.userName || 'User') : 'User';

		callUIManager.showCallUI(true, targetName, isVideo);
		webRTCManager.startCall(targetId, isVideo);
	};

	// Expose handle signal function
	window.handleWebRTCSignal = (senderId, message) => {
		// message is likely the parsed object { type: 'call_offer', ... }
		// But in room.js logic, msg.data might contain the actual signal data if we unwrapped it
		webRTCManager.handleSignal(senderId, message);
	};
}

// Call init immediately
initWebRTC();

// 当 DOM 内容加载完成后执行初始化逻辑
// Run initialization logic when the DOM content is fully loaded
window.addEventListener('DOMContentLoaded', () => {
	// 移除预加载样式类，允许过渡效果
	// Remove preload class to allow transitions
	setTimeout(() => {
		document.body.classList.remove('preload');
	}, 300);

	// 初始化登录表单 / Initialize login form
	initLoginForm();

	const loginForm = $id('login-form');               // 登录表单 / Login form

	if (loginForm) {
		// 监听登录表单提交事件 / Listen to login form submission
		loginForm.addEventListener('submit', loginFormHandler(null))
	}

	const joinBtn = $('.join-room'); // 加入房间按钮 / Join room button
	if (joinBtn) {
		joinBtn.onclick = openLoginModal; // 点击打开登录窗口 / Click to open login modal
	}
	// 阻止用户输入用户名、房间名和密码时输入空格
	// Prevent space input for username, room name, and password fields
	preventSpaceInput($id('userName'));
	preventSpaceInput($id('roomName'));
	preventSpaceInput($id('password'));

	// 初始化翻转卡片功能 / Initialize flip card functionality
	initFlipCard();

	// 初始化辅助功能和界面设置
	// Initialize autofill, input placeholders, and menus
	autofillRoomPwd(); setupInputPlaceholder();
	setupMoreBtnMenu();
	setupContextMenu();
	setupImagePreview(); setupEmojiPicker();
	// 由于我们已经在DOM加载前预先初始化了语言设置，这里不需要重复初始化
	// initSettings();
	// updateStaticTexts(); // 在初始化设置后更新静态文本 / Update static texts after initializing settings
	initTheme(); // 初始化主题 / Initialize theme

	const settingsBtn = $id('settings-btn'); // 设置按钮 / Settings button
	if (settingsBtn) {
		settingsBtn.onclick = (e) => {
			e.stopPropagation();  // 阻止事件冒泡 / Stop event from bubbling
			openSettingsPanel(); // 打开设置面板 / Open settings panel
		}
	}

	// 设置返回按钮事件处理 / Settings back button event handler
	const settingsBackBtn = $id('settings-back-btn');
	if (settingsBackBtn) {
		settingsBackBtn.onclick = (e) => {
			e.stopPropagation();
			closeSettingsPanel(); // 关闭设置面板 / Close settings panel
		}
	}

	// Setup theme toggle button
	const themeToggleBtn = $id('theme-toggle-btn');
	if (themeToggleBtn) {
		themeToggleBtn.onclick = (e) => {
			e.stopPropagation();
			const current = getCurrentTheme();
			// Toggle between light (theme1) and dark (theme12 or theme10)
			// theme1 is light default. theme12 is Metallic Dark.
			const newThemeId = (current.id === 'theme1' || current.id === 'theme2' || current.id === 'theme3') ? 'theme12' : 'theme1';
			applyTheme(newThemeId);
			// Save to local storage
			const settings = JSON.parse(localStorage.getItem('settings') || '{}');
			settings.theme = newThemeId;
			localStorage.setItem('settings', JSON.stringify(settings));
		};
	}
	// 点击其他地方时关闭设置面板 (已移除，因为现在使用侧边栏形式)
	// Close settings panel when clicking outside (removed since we now use sidebar format)
	const input = document.querySelector('.input-message-input'); // 消息输入框 / Message input box

	// 设置图片粘贴功能
	// Setup image paste functionality
	const imagePasteHandler = setupImagePaste('.input-message-input');

	// Setup message swipe gestures (quote and recall)
	setupMessageSwipe();

	if (input) {
		input.focus(); // 自动聚焦 / Auto focus
		input.addEventListener('keydown', (e) => {
			// 按下 Enter 键并且不按 Shift，表示发送消息
			// Pressing Enter (without Shift) sends the message
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});
	}

	// Auto-destruct toggle with time selection
	const destructBtn = $id('chat-destruct-btn');
	let isAutoDestruct = false;
	let autoDestructTime = 30000; // Default 30 seconds

	if (destructBtn) {
		// Create time selection dropdown
		const destructMenu = document.createElement('div');
		destructMenu.className = 'destruct-time-menu';
		destructMenu.innerHTML = `
			<div class="destruct-time-option" data-time="10000">10秒</div>
			<div class="destruct-time-option" data-time="30000">30秒</div>
			<div class="destruct-time-option active" data-time="60000">1分钟</div>
			<div class="destruct-time-option" data-time="300000">5分钟</div>
			<div class="destruct-time-option" data-time="600000">10分钟</div>
		`;
		destructBtn.parentElement.appendChild(destructMenu);

		// Toggle destruct mode
		destructBtn.onclick = function (e) {
			e.stopPropagation();
			isAutoDestruct = !isAutoDestruct;
			if (isAutoDestruct) {
				destructBtn.classList.add('active');
				destructBtn.style.color = '#e74c3c';
				destructMenu.classList.add('show');
			} else {
				destructBtn.classList.remove('active');
				destructBtn.style.color = '';
				destructMenu.classList.remove('show');
			}
		};

		// Handle time selection
		destructMenu.addEventListener('click', function (e) {
			e.stopPropagation();
			const option = e.target.closest('.destruct-time-option');
			if (option) {
				autoDestructTime = parseInt(option.dataset.time);
				destructMenu.querySelectorAll('.destruct-time-option').forEach(opt => opt.classList.remove('active'));
				option.classList.add('active');
			}
		});

		// Close menu when clicking outside
		document.addEventListener('click', function () {
			destructMenu.classList.remove('show');
		});
	}

	// 发送消息的统一函数
	// Unified function to send messages
	function sendMessage() {
		const text = input.innerText.trim(); // 获取输入的文本 / Get input text
		const images = imagePasteHandler ? imagePasteHandler.getCurrentImages() : []; // 获取所有图片

		if (!text && images.length === 0) return; // 如果没有文本且没有图片，则不发送
		const rd = roomsData[activeRoomIndex]; // 当前房间数据 / Current room data

		const destructDuration = isAutoDestruct ? autoDestructTime : null;

		// Check if there's a quote
		const quotePreview = document.querySelector('.quote-preview');
		let quotedMessage = null;
		if (quotePreview) {
			const quoteSender = quotePreview.querySelector('.quote-sender')?.textContent;
			const quoteText = quotePreview.querySelector('.quote-message')?.textContent;
			if (quoteSender && quoteText) {
				quotedMessage = {
					sender: quoteSender,
					text: quoteText
				};
			}
		}

		if (rd && rd.chat) {
			if (images.length > 0) {
				// 发送包含图片的消息 (支持多图和文字合并)
				// Send message with images (supports multiple images and text combined)
				const messageContent = {
					text: text || '', // 包含文字内容，如果有的话
					images: images,    // 包含所有图片数据
					autoDestruct: destructDuration,
					quote: quotedMessage
				};

				if (rd.privateChatTargetId) {
					// 私聊图片消息加密并发送
					// Encrypt and send private image message
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: 'image_private',
							d: messageContent
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared); rd.chat.sendMessage(encryptedMessageForServer);
						addMsg(messageContent, false, 'image_private', null, destructDuration);
					} else {
						addSystemMsg(`${t('system.private_message_failed', 'Cannot send private message to')} ${rd.privateChatTargetName}. ${t('system.user_not_connected', 'User might not be fully connected.')}`)
					}
				} else {
					// 公开聊天带图片
					// Public chat with images
					rd.chat.sendChannelMessage('image', messageContent);
					addMsg(messageContent, false, 'image', null, destructDuration); // 显示本地发送的图片消息，包括文字 / Show local sent image message including text
				}
			} else if (text) {
				// 发送纯文本消息
				// Send text-only message
				let messageToSend = text;

				// Only wrap in object if there's autoDestruct or quote
				if (destructDuration || quotedMessage) {
					messageToSend = {
						text: text,
						autoDestruct: destructDuration,
						quote: quotedMessage
					};
				}

				if (rd.privateChatTargetId) {
					// 私聊文本加密
					// Encrypt private text message
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: 'text_private',
							d: messageToSend
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);
						rd.chat.sendMessage(encryptedMessageForServer);
						addMsg(messageToSend, false, 'text_private', null, destructDuration);
					} else {
						addSystemMsg(`${t('system.private_message_failed', 'Cannot send private message to')} ${rd.privateChatTargetName}. ${t('system.user_not_connected', 'User might not be fully connected.')}`)
					}
				} else {
					// 公开聊天文本
					// Public chat text
					rd.chat.sendChannelMessage('text', messageToSend);
					addMsg(messageToSend, false, 'text', null, destructDuration);
				}
			}

			// 清空输入框并触发 input 事件
			// Clear input and trigger input event
			input.innerHTML = ''; // 清空输入框内容 / Clear input field content
			if (imagePasteHandler) {
				if (typeof imagePasteHandler.clearImages === 'function') imagePasteHandler.clearImages();
				if (typeof imagePasteHandler.refreshPlaceholder === 'function') imagePasteHandler.refreshPlaceholder(); // 更新 placeholder 状态
			}
			clearQuote(); // Clear quote preview
			autoGrowInput(); // 调整输入框高度
		}
	}

	// 为发送按钮添加点击事件
	// Add click event for send button
	const sendButton = document.querySelector('.send-message-btn');
	if (sendButton) {
		sendButton.addEventListener('click', sendMessage);
	}

	// Setup Voice Recording
	import('./util.voice.js').then(({ setupVoiceRecording }) => {
		setupVoiceRecording((voiceData) => {
			// onSend callback
			const rd = roomsData[activeRoomIndex];
			if (rd && rd.chat) {
				const destructDuration = isAutoDestruct ? autoDestructTime : null; // Re-read global autoDestruct setting

				// Voice message content
				const messageContent = {
					voice: voiceData.audio,
					duration: voiceData.duration,
					autoDestruct: destructDuration
				};

				if (rd.privateChatTargetId) {
					// Private voice
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: 'voice_private',
							d: messageContent
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);
						rd.chat.sendMessage(encryptedMessageForServer);
						addMsg(messageContent, false, 'voice_private', null, destructDuration);
					} else {
						addSystemMsg(`${t('system.private_message_failed', 'Cannot send private message to')} ${rd.privateChatTargetName}.`)
					}
				} else {
					// Public voice
					rd.chat.sendChannelMessage('voice', messageContent);
					addMsg(messageContent, false, 'voice', null, destructDuration);
				}
			}
		});
	});

	// 设置发送文件功能
	// Setup file sending functionality
	setupFileSend({
		inputSelector: '.input-message-input', // 消息输入框选择器 / Message input selector
		attachBtnSelector: '.chat-attach-btn', // 附件按钮选择器 / Attach button selector
		fileInputSelector: '.new-message-wrapper input[type="file"]', // 文件输入框选择器 / File input selector
		onSend: (message) => {
			const rd = roomsData[activeRoomIndex];
			if (rd && rd.chat) {
				const userName = rd.myUserName || '';
				const destructDuration = isAutoDestruct ? autoDestructTime : null;
				const msgWithUser = { ...message, userName, autoDestruct: destructDuration };
				if (rd.privateChatTargetId) {
					// 私聊文件加密并发送
					// Encrypt and send private file message
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: msgWithUser.type + '_private',
							d: msgWithUser
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);
						rd.chat.sendMessage(encryptedMessageForServer);

						// 添加到自己的聊天记录
						if (msgWithUser.type === 'file_start') {
							addMsg(msgWithUser, false, 'file_private');
						}
					} else {
						addSystemMsg(`${t('system.private_file_failed', 'Cannot send private file to')} ${rd.privateChatTargetName}. ${t('system.user_not_connected', 'User might not be fully connected.')}`)
					}
				} else {
					// 公共频道文件发送
					// Send file to public channel
					rd.chat.sendChannelMessage(msgWithUser.type, msgWithUser);

					// 添加到自己的聊天记录
					if (msgWithUser.type === 'file_start') {
						addMsg(msgWithUser, false, 'file');
					}
				}
			}
		}
	});


	// 判断是否为移动端
	// Check if the device is mobile
	const isMobile = () => window.innerWidth <= 768;

	// 渲染主界面元素
	// Render main UI elements
	renderMainHeader();
	renderUserList();
	setupTabs();

	const roomList = $id('room-list');
	const sidebar = $id('sidebar');
	const rightbar = $id('rightbar');
	const sidebarMask = $id('mobile-sidebar-mask');
	const rightbarMask = $id('mobile-rightbar-mask');

	// 在移动端点击房间列表后关闭侧边栏
	// On mobile, clicking room list closes sidebar
	if (roomList) {
		roomList.addEventListener('click', () => {
			if (isMobile()) {
				sidebar?.classList.remove('mobile-open');
				sidebarMask?.classList.remove('active');
			}
		});
	}

	// 在移动端点击成员标签后关闭右侧面板
	// On mobile, clicking member tabs closes right panel
	const memberTabs = $id('member-tabs');
	if (memberTabs) {
		memberTabs.addEventListener('click', () => {
			if (isMobile()) {
				removeClass(rightbar, 'mobile-open');
				removeClass(rightbarMask, 'active');
			}
		});
	}
});

// Listen for language change events
// 监听语言切换事件
window.addEventListener('languageChange', (event) => {
	updateStaticTexts();
});

// 全局拖拽文件自动打开附件功能
// Global drag file to auto trigger attach button
let dragCounter = 0;
let hasTriggeredAttach = false;

// 监听文件上传模态框关闭事件，重置拖拽标志位
window.addEventListener('fileUploadModalClosed', () => {
	hasTriggeredAttach = false;
});

document.addEventListener('dragenter', (e) => {
	dragCounter++;
	if (!hasTriggeredAttach && e.dataTransfer.items.length > 0) {
		// 检查是否有文件
		for (let item of e.dataTransfer.items) {
			if (item.kind === 'file') {
				// 自动点击附件按钮
				const attachBtn = document.querySelector('.chat-attach-btn');
				if (attachBtn) {
					attachBtn.click();
					hasTriggeredAttach = true;
				}
				break;
			}
		}
	}
});

document.addEventListener('dragleave', (e) => {
	dragCounter--;
	if (dragCounter === 0) {
		hasTriggeredAttach = false;
	}
});

document.addEventListener('dragover', (e) => {
	e.preventDefault();
});

document.addEventListener('drop', (e) => {
	e.preventDefault();
	dragCounter = 0;
	hasTriggeredAttach = false;
});
