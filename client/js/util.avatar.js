// Import dicebear avatar libraries
// 导入 dicebear 头像库
import * as dicebearCore from '@dicebear/core';
import * as dicebearMicah from '@dicebear/micah';
// Predefined background colors
// 预设背景色数组
const bgColors = ["f87171", "fb923c", "09acf4", "fb923c", "f472b6", "a78bfa", "34d399"];
// Pick a color based on seed string
// 根据种子字符串选择颜色
function pickColor(seed) {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	return bgColors[Math.abs(hash) % bgColors.length]
}
// Create SVG avatar for user name
// 为用户名生成 SVG 头像
export function createAvatarSVG(userName) {
	return dicebearCore.createAvatar(dicebearMicah, {
		seed: userName,
		baseColor: ["f7e1c3", "f9c9b6", "f2d6cb", "f8ce8e", "eac393"],
		backgroundColor: [pickColor(userName)]
	}).toString()
}

// Store custom avatars in localStorage
// 在 localStorage 中存储自定义头像
const AVATAR_STORAGE_KEY = 'nodecrypt_custom_avatars';

// Get custom avatar for a user
// 获取用户的自定义头像
export function getCustomAvatar(userName) {
	try {
		const avatars = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) || '{}');
		return avatars[userName] || null;
	} catch (e) {
		console.error('Error reading custom avatar:', e);
		return null;
	}
}

// Set custom avatar for a user
// 设置用户的自定义头像
export function setCustomAvatar(userName, imageData) {
	try {
		const avatars = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) || '{}');
		avatars[userName] = imageData;
		localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatars));
		return true;
	} catch (e) {
		console.error('Error saving custom avatar:', e);
		return false;
	}
}

// Remove custom avatar for a user
// 删除用户的自定义头像
export function removeCustomAvatar(userName) {
	try {
		const avatars = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) || '{}');
		delete avatars[userName];
		localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(avatars));
		return true;
	} catch (e) {
		console.error('Error removing custom avatar:', e);
		return false;
	}
}

// Get avatar (custom or generated)
// 获取头像（自定义或生成的）
export function getAvatar(userName) {
	const customAvatar = getCustomAvatar(userName);
	if (customAvatar) {
		return customAvatar;
	}
	return createAvatarSVG(userName);
}

// Show avatar upload modal
// 显示头像上传模态框
export function showAvatarUploadModal(userName, onSave) {
	const modal = document.createElement('div');
	modal.className = 'avatar-upload-modal';
	modal.innerHTML = `
		<div class="avatar-upload-overlay"></div>
		<div class="avatar-upload-content">
			<button class="avatar-upload-close">&times;</button>
			<h2>设置头像</h2>
			<div class="avatar-preview">
				<div class="current-avatar" id="avatar-preview"></div>
			</div>
			<div class="avatar-upload-options">
				<label class="upload-btn">
					<input type="file" accept="image/*" id="avatar-file-input" style="display: none;">
					<span>📷 上传图片</span>
				</label>
				<button class="reset-btn" id="avatar-reset-btn">🔄 重置为默认</button>
			</div>
			<div class="avatar-upload-actions">
				<button class="cancel-btn" id="avatar-cancel-btn">取消</button>
				<button class="save-btn" id="avatar-save-btn">保存</button>
			</div>
		</div>
	`;
	
	document.body.appendChild(modal);
	
	// Show current avatar
	const preview = modal.querySelector('#avatar-preview');
	preview.innerHTML = getAvatar(userName);
	
	// Handle file upload
	const fileInput = modal.querySelector('#avatar-file-input');
	let uploadedImageData = null;
	
	fileInput.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				uploadedImageData = event.target.result;
				preview.innerHTML = `<img src="${uploadedImageData}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
			};
			reader.readAsDataURL(file);
		}
	});
	
	// Handle reset
	const resetBtn = modal.querySelector('#avatar-reset-btn');
	resetBtn.addEventListener('click', () => {
		uploadedImageData = null;
		preview.innerHTML = createAvatarSVG(userName);
	});
	
	// Handle close
	const closeBtn = modal.querySelector('.avatar-upload-close');
	const cancelBtn = modal.querySelector('#avatar-cancel-btn');
	const overlay = modal.querySelector('.avatar-upload-overlay');
	
	const closeModal = () => {
		modal.remove();
	};
	
	closeBtn.addEventListener('click', closeModal);
	cancelBtn.addEventListener('click', closeModal);
	overlay.addEventListener('click', closeModal);
	
	// Handle save
	const saveBtn = modal.querySelector('#avatar-save-btn');
	saveBtn.addEventListener('click', () => {
		if (uploadedImageData) {
			setCustomAvatar(userName, uploadedImageData);
		} else {
			removeCustomAvatar(userName);
		}
		if (onSave) onSave();
		closeModal();
	});
	
	return modal;
}