// Message swipe actions: left to quote, right to recall
import { $, $id, createElement } from './util.dom.js';
import { roomsData, activeRoomIndex } from './room.js';
import { t } from './util.i18n.js';

let currentSwipeElement = null;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isSwiping = false;
let swipeDirection = null; // 'left' or 'right'

// Setup swipe actions for messages
export function setupMessageSwipe() {
    const chatArea = $id('chat-area');
    if (!chatArea) return;

    // Use event delegation
    chatArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    chatArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    chatArea.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse support for desktop testing
    chatArea.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleTouchStart(e) {
    const bubble = e.target.closest('.bubble.me, .bubble.other');
    if (!bubble) return;

    // Don't trigger on system messages or interactive elements
    if (bubble.classList.contains('system')) return;
    if (e.target.closest('button, a, audio, img, video, .destruct-timer')) return;

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = startX;
    currentY = startY;
    currentSwipeElement = bubble;
    isSwiping = false;
    swipeDirection = null;

    // Get the wrapper if it's an "other" message
    if (bubble.classList.contains('other')) {
        currentSwipeElement = bubble.closest('.bubble-other-wrap') || bubble;
    }
}

function handleTouchMove(e) {
    if (!currentSwipeElement) return;

    const touch = e.touches[0];
    currentX = touch.clientX;
    currentY = touch.clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Determine if it's a horizontal swipe
    if (Math.abs(deltaX) > 10 && Math.abs(deltaY) < Math.abs(deltaX) * 0.5) {
        isSwiping = true;
        e.preventDefault(); // Prevent scrolling during swipe

        // Determine direction
        if (deltaX > 0) {
            swipeDirection = 'right'; // Right swipe = recall
        } else {
            swipeDirection = 'left'; // Left swipe = quote
        }

        // Apply transform with limits
        const maxSwipe = 80;
        const clampedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
        currentSwipeElement.style.transform = `translateX(${clampedDeltaX}px)`;
        currentSwipeElement.style.transition = 'none';

        // Show visual feedback
        updateSwipeIndicator(clampedDeltaX);
    }
}

function handleTouchEnd(e) {
    if (!currentSwipeElement || !isSwiping) {
        resetSwipe();
        return;
    }

    const deltaX = currentX - startX;
    const threshold = 60; // Minimum swipe distance to trigger action

    if (Math.abs(deltaX) >= threshold) {
        const bubble = currentSwipeElement.classList.contains('bubble')
            ? currentSwipeElement
            : currentSwipeElement.querySelector('.bubble');

        if (swipeDirection === 'right' && bubble.classList.contains('me')) {
            // Right swipe on own message = recall
            triggerRecall(bubble);
        } else if (swipeDirection === 'left') {
            // Left swipe = quote message
            triggerQuote(bubble);
        }
    }

    // Animate back to position
    currentSwipeElement.style.transition = 'transform 0.3s ease';
    currentSwipeElement.style.transform = 'translateX(0)';

    setTimeout(() => {
        resetSwipe();
    }, 300);
}

function handleMouseDown(e) {
    const bubble = e.target.closest('.bubble.me, .bubble.other');
    if (!bubble) return;

    if (bubble.classList.contains('system')) return;
    if (e.target.closest('button, a, audio, img, video, .destruct-timer')) return;

    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;
    currentSwipeElement = bubble;
    isSwiping = false;
    swipeDirection = null;

    if (bubble.classList.contains('other')) {
        currentSwipeElement = bubble.closest('.bubble-other-wrap') || bubble;
    }
}

function handleMouseMove(e) {
    if (!currentSwipeElement) return;

    currentX = e.clientX;
    currentY = e.clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (Math.abs(deltaX) > 10 && Math.abs(deltaY) < Math.abs(deltaX) * 0.5) {
        isSwiping = true;

        if (deltaX > 0) {
            swipeDirection = 'right';
        } else {
            swipeDirection = 'left';
        }

        const maxSwipe = 80;
        const clampedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
        currentSwipeElement.style.transform = `translateX(${clampedDeltaX}px)`;
        currentSwipeElement.style.transition = 'none';
        currentSwipeElement.style.cursor = 'grabbing';

        updateSwipeIndicator(clampedDeltaX);
    }
}

function handleMouseUp(e) {
    if (!currentSwipeElement || !isSwiping) {
        resetSwipe();
        return;
    }

    const deltaX = currentX - startX;
    const threshold = 60;

    if (Math.abs(deltaX) >= threshold) {
        const bubble = currentSwipeElement.classList.contains('bubble')
            ? currentSwipeElement
            : currentSwipeElement.querySelector('.bubble');

        if (swipeDirection === 'right' && bubble.classList.contains('me')) {
            triggerRecall(bubble);
        } else if (swipeDirection === 'left') {
            triggerQuote(bubble);
        }
    }

    currentSwipeElement.style.transition = 'transform 0.3s ease';
    currentSwipeElement.style.transform = 'translateX(0)';
    currentSwipeElement.style.cursor = '';

    setTimeout(() => {
        resetSwipe();
    }, 300);
}

function updateSwipeIndicator(deltaX) {
    if (!currentSwipeElement) return;

    // Remove any existing indicator
    const existingIndicator = currentSwipeElement.querySelector('.swipe-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // Create new indicator
    const indicator = createElement('div', { class: 'swipe-indicator' });

    if (deltaX > 0) {
        // Right swipe - recall
        const bubble = currentSwipeElement.classList.contains('bubble')
            ? currentSwipeElement
            : currentSwipeElement.querySelector('.bubble');

        if (bubble && bubble.classList.contains('me')) {
            indicator.innerHTML = '🗑️ 撤回';
            indicator.classList.add('swipe-recall');
            currentSwipeElement.appendChild(indicator);
        }
    } else if (deltaX < 0) {
        // Left swipe - quote
        indicator.innerHTML = '💬 引用';
        indicator.classList.add('swipe-quote');
        currentSwipeElement.appendChild(indicator);
    }
}

function resetSwipe() {
    if (currentSwipeElement) {
        const indicator = currentSwipeElement.querySelector('.swipe-indicator');
        if (indicator) {
            indicator.remove();
        }
        currentSwipeElement.style.transform = '';
        currentSwipeElement.style.transition = '';
        currentSwipeElement.style.cursor = '';
    }
    currentSwipeElement = null;
    isSwiping = false;
    swipeDirection = null;
}

function triggerRecall(bubble) {
    const bubbleContent = bubble.querySelector('.bubble-content');
    if (bubbleContent) {
        // Add recall animation
        bubble.style.transition = 'all 0.3s ease';
        bubble.style.transform = 'scale(0.95)';
        bubble.style.opacity = '0.7';

        setTimeout(() => {
            bubbleContent.innerHTML = '<i style="color: #999;">你撤回了一条消息</i>';
            bubble.classList.add('recalled');
            bubble.style.transform = '';
            bubble.style.opacity = '';
        }, 300);
    }
    window.addSystemMsg && window.addSystemMsg(t('system.message_recalled', '你撤回了一条消息'));
}

function triggerQuote(bubble) {
    // Add cool quote effect
    bubble.classList.add('quoting');
    setTimeout(() => bubble.classList.remove('quoting'), 600);

    const content = bubble.querySelector('.bubble-content');
    if (!content) return;

    // Get message text
    let messageText = '';
    const textContent = content.innerText || content.textContent;

    // Handle different message types
    if (bubble.querySelector('.bubble-img')) {
        messageText = '[图片]';
    } else if (bubble.querySelector('.bubble-audio')) {
        messageText = '[语音消息]';
    } else if (bubble.querySelector('.file-message')) {
        const fileName = bubble.querySelector('.file-name');
        messageText = fileName ? `[文件: ${fileName.textContent}]` : '[文件]';
    } else {
        messageText = textContent.substring(0, 50); // Limit length
        if (textContent.length > 50) {
            messageText += '...';
        }
    }

    // Get sender name
    let senderName = '我';
    if (bubble.classList.contains('other')) {
        const nameEl = bubble.closest('.bubble-other-wrap')?.querySelector('.bubble-other-name');
        senderName = nameEl ? nameEl.textContent : '对方';
    }

    // Show quote in input area
    showQuoteUI(senderName, messageText);
}

function showQuoteUI(sender, message) {
    const inputArea = document.querySelector('.chat-input-area');
    if (!inputArea) return;

    // Remove existing quote
    const existingQuote = inputArea.querySelector('.quote-preview');
    if (existingQuote) {
        existingQuote.remove();
    }

    // Create quote preview
    const quotePreview = createElement('div', { class: 'quote-preview' });
    quotePreview.innerHTML = `
		<div class="quote-content">
			<div class="quote-sender">${sender}</div>
			<div class="quote-message">${message}</div>
		</div>
		<button class="quote-close" type="button">×</button>
	`;

    // Insert before input wrapper
    const inputWrapper = inputArea.querySelector('.chat-input-wrapper');
    if (inputWrapper) {
        inputArea.insertBefore(quotePreview, inputWrapper);
    }

    // Handle close button
    const closeBtn = quotePreview.querySelector('.quote-close');
    if (closeBtn) {
        closeBtn.onclick = () => quotePreview.remove();
    }

    // Focus input
    const input = document.querySelector('.input-message-input');
    if (input) {
        input.focus();
    }

    // Show with animation
    setTimeout(() => {
        quotePreview.classList.add('show');
    }, 10);
}

// Export functions for external use
export function clearQuote() {
    const quotePreview = document.querySelector('.quote-preview');
    if (quotePreview) {
        quotePreview.remove();
    }
}
