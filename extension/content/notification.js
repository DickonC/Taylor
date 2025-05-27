// notification.js
class SizeRecommendationNotification {
    constructor() {
        this.notification = null;
        this.createNotificationElement();
    }

    createNotificationElement() {
        // Create notification container
        this.notification = document.createElement('div');
        this.notification.className = 'size-recommendation-notification';
        this.notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 16px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: none;
            animation: slideIn 0.3s ease-out;
            max-width: 280px;
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .size-recommendation-notification {
                border: 2px solid #4CAF50;
            }
            .size-recommendation-notification .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            .size-recommendation-notification .header h3 {
                margin: 0;
                color: #2d5a27;
                font-size: 16px;
                font-weight: 600;
            }
            .size-recommendation-notification .close-btn {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .size-recommendation-notification .close-btn:hover {
                background: #f5f5f5;
            }
            .size-recommendation-notification .size {
                font-size: 32px;
                font-weight: 700;
                color: #2d5a27;
                text-align: center;
                margin: 8px 0;
            }
            .size-recommendation-notification .details {
                font-size: 12px;
                color: #666;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.notification);
    }

    show(recommendation) {
        this.notification.innerHTML = `
            <div class="header">
                <h3>✨ Size Recommendation</h3>
                <button class="close-btn" id="close-notification">×</button>
            </div>
            <div class="size">${recommendation.size}</div>
            <div class="details">
                ${recommendation.averageCost === 0 
                    ? 'Perfect fit! (0.0cm avg difference)'
                    : `${recommendation.averageCost.toFixed(1)}cm average difference`}
            </div>
        `;

        this.notification.style.display = 'block';

        // Add event listener for close button
        document.getElementById('close-notification').addEventListener('click', () => {
            this.hide();
        });

        // Auto-hide after 20 seconds (doubled from 10)
        setTimeout(() => this.hide(), 20000);
    }

    hide() {
        this.notification.style.display = 'none';
    }
}

// Create global instance
window.sizeRecommendationNotification = new SizeRecommendationNotification();