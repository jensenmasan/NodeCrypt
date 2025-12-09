// Message recall functionality
import { $, $id, createElement, on } from './util.dom.js';
import { roomsData, activeRoomIndex } from './room.js';
import { t } from './util.i18n.js';

let longPressTimer = null;
let contextMenu = null;
let startX = 0;
let startY = 0;
let hasMoved = false;

// Setup message recall with long press
export function setupMessageRecall() {
    const chatArea = $id('chat-area');
    if (!chatArea) return;

    // Use event delegation to avoid blocking normal interactions
    chatArea.addEventListener('touchstart', handleTouchStart, { passive: true });
    chatArea.addEventListener('touchmove', handleTouchMove, { passive: true });
    chatArea.addEventListener('touchend', handleTouchEnd, { passive: true });
    chatArea.addEventListener('mousedown', handleMouseDown);
    chatArea.addEventListener('mousemove', handleMouseMove);
    chatArea.addEventListener('mouseup', handleMouseUp);

    // Close context menu on click outside
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('touchstart', (e) => {
        if (contextMenu && !e.target.closest('.message-context-menu')) {
            hideContextMenu();
        }
    }, { passive: true });
}

function handleTouchStart(e) {
    const bubble = e.target.closest('.bubble.me, .bubble.other');
    if (!bubble) return;

    // Don't trigger on system messages or interactive elements
    if (bubble.classList.contains('system')) return;
    if (e.target.closest('button, a, audio, img, video')) return;

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    hasMoved = false;

    clearLongPress();

    longPressTimer = setTimeout(() => {
        if (!hasMoved) {
            showContextMenu(e, bubble);
        }
    }, 600); // 600ms for mobile to avoid conflicts with scrolling
}

function handleTouchMove(e) {
    if (!longPressTimer) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);

    // If user moves more than 10px, cancel long press
    if (deltaX > 10 || deltaY > 10) {
        hasMoved = true;
        clearLongPress();
    }
}

function handleTouchEnd(e) {
    clearLongPress();
}

function handleMouseDown(e) {
    const bubble = e.target.closest('.bubble.me, .bubble.other');
    if (!bubble) return;

    // Don't trigger on system messages or interactive elements
    if (bubble.classList.contains('system')) return;
    if (e.target.closest('button, a, audio, img, video')) return;

    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;

    clearLongPress();

    longPressTimer = setTimeout(() => {
        if (!hasMoved) {
            showContextMenu(e, bubble);
        }
    }, 500); // 500ms for desktop
}

function handleMouseMove(e) {
    if (!longPressTimer) return;

    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    // If user moves more than 5px, cancel long press
    if (deltaX > 5 || deltaY > 5) {
        hasMoved = true;
        clearLongPress();
    }
}

function handleMouseUp(e) {
    clearLongPress();
}

function clearLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(e, bubble) {
    // Prevent default only when showing menu
    e.preventDefault && e.preventDefault();

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
    const touch = e.touches ? e.touches[0] : null;
    const x = touch ? touch.clientX : e.clientX;
    const y = touch ? touch.clientY : e.clientY;

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
