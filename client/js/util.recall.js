// Message recall functionality
import { $, $id, createElement, on } from './util.dom.js';
import { roomsData, activeRoomIndex } from './room.js';
import { t } from './util.i18n.js';

let longPressTimer = null;
let contextMenu = null;

// Setup message recall with long press
export function setupMessageRecall() {
    const chatArea = $id('chat-area');
    if (!chatArea) return;

    // Handle long press on bubbles
    on(chatArea, 'touchstart', handleLongPressStart);
    on(chatArea, 'mousedown', handleLongPressStart);
    on(chatArea, 'touchend', clearLongPress);
    on(chatArea, 'touchmove', clearLongPress);
    on(chatArea, 'mouseup', clearLongPress);
    on(chatArea, 'mousemove', clearLongPress);

    // Close context menu on click outside
    on(document, 'click', hideContextMenu);
}

function handleLongPressStart(e) {
    const bubble = e.target.closest('.bubble.me, .bubble.other');
    if (!bubble) return;

    // Don't trigger on system messages or buttons
    if (bubble.classList.contains('system')) return;
    if (e.target.closest('button, a, audio, img')) return;

    clearLongPress();

    const startX = e.clientX || e.touches?.[0]?.clientX;
    const startY = e.clientY || e.touches?.[0]?.clientY;

    longPressTimer = setTimeout(() => {
        // Check if we haven't moved (for mouse events)
        const currentX = e.clientX || startX;
        const currentY = e.clientY || startY;
        const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

        if (distance < 10) { // Threshold 10px
            showContextMenu(e, bubble);
        }
    }, 500); // 500ms long press
}

function clearLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(e, bubble) {
    hideContextMenu(); // Hide any existing menu

    const isMyMessage = bubble.classList.contains('me');

    // Create context menu
    contextMenu = createElement('div', { class: 'message-context-menu' });

    // Add recall option for own messages
    if (isMyMessage) {
        const recallBtn = createElement('div', { class: 'context-menu-item' },
            '<span>撤回消息</span>');
        recallBtn.onclick = (evt) => {
            evt.stopPropagation();
            recallMessage(bubble);
            hideContextMenu();
        };
        contextMenu.appendChild(recallBtn);
    }

    // Add copy option
    const copyBtn = createElement('div', { class: 'context-menu-item' },
        '<span>复制</span>');
    copyBtn.onclick = (evt) => {
        evt.stopPropagation();
        copyMessage(bubble);
        hideContextMenu();
    };
    contextMenu.appendChild(copyBtn);

    document.body.appendChild(contextMenu);

    // Position the menu
    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;

    const menuRect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let menuX = x;
    let menuY = y;

    // Adjust position if menu goes out of viewport
    if (menuX + menuRect.width > viewportWidth) {
        menuX = viewportWidth - menuRect.width - 10;
    }
    if (menuY + menuRect.height > viewportHeight) {
        menuY = viewportHeight - menuRect.height - 10;
    }

    contextMenu.style.left = `${menuX}px`;
    contextMenu.style.top = `${menuY}px`;
    contextMenu.classList.add('show');

    e.preventDefault();
}

function hideContextMenu() {
    if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}

function recallMessage(bubble) {
    // Find the message index in roomsData
    const rd = roomsData[activeRoomIndex];
    if (!rd) return;

    // Add recalled indicator
    const bubbleContent = bubble.querySelector('.bubble-content');
    if (bubbleContent) {
        bubbleContent.innerHTML = '<i style="color: #999;">你撤回了一条消息</i>';
        bubble.classList.add('recalled');
    }

    // In a real implementation, you would also send a recall command to other users
    // For now, we'll just mark it locally
    window.addSystemMsg && window.addSystemMsg(t('system.message_recalled', '你撤回了一条消息'));
}

function copyMessage(bubble) {
    const content = bubble.querySelector('.bubble-content');
    if (!content) return;

    const text = content.innerText || content.textContent;

    // Try to copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            window.notifyMessage && window.notifyMessage(t('system.copied', '已复制'));
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        window.notifyMessage && window.notifyMessage(t('system.copied', '已复制'));
    } catch (err) {
        console.error('Copy failed:', err);
    }
    document.body.removeChild(textarea);
}
