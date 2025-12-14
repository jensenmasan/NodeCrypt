// Import DOM helpers
// 导入 DOM 辅助函数
import {
	$,
	on
} from './util.dom.js';
import 'emoji-picker-element';
// Add emoji picker styles to document
// 向文档添加 emoji 选择器样式
const addEmojiPickerStyles = () => {
	if (document.querySelector('#emoji-picker-styles')) return;
	const style = document.createElement('style');
	style.id = 'emoji-picker-styles';
	style.textContent = `emoji-picker{--background:#fff;--border-color:rgba(0,0,0,0.1);--border-radius:10px;--emoji-padding:0.4rem;--category-emoji-size:1.2rem;--font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;position:absolute;bottom:60px;left:22px;z-index:5;box-shadow:0 3px 12px rgba(0,0,0,0.15);display:none;opacity:0;transform:translateY(-10px) scale(0.95);transition:opacity 0.3s ease,transform 0.3s ease}emoji-picker.show{opacity:1;transform:translateY(0) scale(1)}`;
	document.head.appendChild(style)
};
// Setup emoji picker for chat input
// 为聊天输入框设置 emoji 选择器
export function setupEmojiPicker({
	btnSelector = '.chat-emoji-btn',
	inputSelector = '.input-message-input'
} = {}) {
	const btn = $(btnSelector);
	const input = $(inputSelector);
	if (!btn || !input) return;
	try {
		addEmojiPickerStyles();
		const oldPicker = $('emoji-picker', btn.parentNode);
		if (oldPicker) oldPicker.remove();
		const picker = document.createElement('emoji-picker');
		picker.style.display = 'none';
		btn.parentNode.style.position = 'relative';
		btn.parentNode.appendChild(picker);
		// Emoji click event
		// 监听 emoji 点击事件
		picker.addEventListener('emoji-click', event => {
			insertEmoji(input, event.detail.unicode);
			hidePickerWithAnimation();
		});

		function showPickerWithAnimation() {
			picker.style.display = 'block';
			// 强制触发重绘，然后添加打开动画
			picker.offsetHeight; // 强制重绘
			picker.classList.add('show');
		}

		function hidePickerWithAnimation() {
			picker.classList.remove('show');
			setTimeout(() => {
				picker.style.display = 'none';
			}, 300);
		}

		// Button click toggles picker - Enhanced for mobile
		// 按钮点击切换选择器显示 - 移动端增强
		let lastToggleTime = 0;
		const togglePicker = (ev) => {
			// Prevent duplicate events (touchend + click firing together on mobile)
			const now = Date.now();
			if (now - lastToggleTime < 500) {
				return;
			}
			lastToggleTime = now;

			ev.preventDefault();
			ev.stopPropagation();
			if (picker.style.display === 'none') {
				showPickerWithAnimation();
			} else {
				hidePickerWithAnimation();
			}
		};

		// Use both click and touchend for maximum compatibility
		on(btn, 'click', togglePicker);
		on(btn, 'touchend', togglePicker);

		// Hide picker when clicking outside
		// 点击外部隐藏选择器
		on(document, 'click', (ev) => {
			if (!picker.contains(ev.target) && ev.target !== btn) {
				hidePickerWithAnimation();
			}
		});
		on(document, 'touchend', (ev) => {
			if (!picker.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) {
				hidePickerWithAnimation();
			}
		});

	} catch (error) {
		console.error('Failed to initialize emoji picker:', error)
	}
}
// Insert emoji into input at cursor
// 在光标处插入 emoji 到输入框
// Insert emoji into input at cursor
// 在光标处插入 emoji 到输入框
function insertEmoji(input, emoji) {
	// Focus input first
	input.focus();

	// Function to dispatch events
	const triggerInputEvent = () => {
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	};

	let inserted = false;

	// Try execCommand first (best for undo/redo history)
	try {
		inserted = document.execCommand('insertText', false, emoji);
	} catch (e) {
		console.warn('execCommand insertText failed', e);
	}

	// Fallback 1: Selection/Range API
	if (!inserted && window.getSelection) {
		const sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			const range = sel.getRangeAt(0);
			// Check if range is inside input
			if (input.contains(range.commonAncestorContainer)) {
				range.deleteContents();
				const textNode = document.createTextNode(emoji);
				range.insertNode(textNode);
				range.setStartAfter(textNode);
				range.setEndAfter(textNode);
				sel.removeAllRanges();
				sel.addRange(range);
				inserted = true;
			}
		}
	}

	// Fallback 2: Direct text manipulation
	if (!inserted) {
		input.innerText += emoji;
		// Move cursor to end
		const range = document.createRange();
		range.selectNodeContents(input);
		range.collapse(false);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

	// Always trigger input event
	triggerInputEvent();

	// Force check empty state explicitly if needed
	if (input.classList.contains('is-empty')) {
		input.classList.remove('is-empty');
	}
}