// Common selectors for primary price elements
const PRICE_SELECTORS = [
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price',
    '[data-price-type="finalPrice"]',
    '.product-price',
    '.price-current'
];

// Primary selectors for "Add to Cart" buttons
const ADD_TO_CART_SELECTORS = [
    '#add-to-cart-button',
    '#addToCart',
    'button[name="add-to-cart"]',
    'button[name="addToCart"]'
];

function findFirstValidPrice() {
    // First try the primary price selectors
    for (const selector of PRICE_SELECTORS) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const text = element.textContent.trim();
            if (/(?:£|\$|€)\s*\d+(?:\.\d{2})?/.test(text)) {
                return text;
            }
        }
    }

    // Fallback: Look for any element with a currency symbol and numbers
    const elements = document.querySelectorAll('*');
    for (const element of elements) {
        const text = element.textContent.trim();
        if (/^(?:£|\$|€)\s*\d+(?:\.\d{2})?$/.test(text)) {
            return text;
        }
    }

    return null;
}

function findFirstValidCartButton() {
    // First try the primary cart button selectors
    for (const selector of ADD_TO_CART_SELECTORS) {
        const element = document.querySelector(selector);
        if (element) {
            return element.textContent.trim();
        }
    }

    // Fallback: Look for buttons with specific text
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    for (const button of buttons) {
        const text = button.textContent.trim().toLowerCase();
        if (text === 'add to cart' || text === 'add to basket' || text === 'add to bag') {
            return button.textContent.trim();
        }
    }

    return null;
}

let hasTriggeredExtraction = false;

function checkProductPage() {
    if (hasTriggeredExtraction) return false;
    
    console.log('🔍 Checking for product page indicators...');
    
    const price = findFirstValidPrice();
    const cartButton = findFirstValidCartButton();

    if (price || cartButton) {
        if (price) {
            console.log('💰 Found price:', price);
        }
        if (cartButton) {
            console.log('🛒 Found cart button:', cartButton);
        }
        console.log('🎯 Product page detected!');
        
        hasTriggeredExtraction = true;  // Set the flag
        
        document.dispatchEvent(new CustomEvent('productPageDetected', {
            detail: {
                price: price,
                hasCartButton: !!cartButton,
                url: window.location.href
            }
        }));
        
        return true;
    }
    
    return false;
}

// Initial check with a small delay to let the page load
setTimeout(() => {
    checkProductPage();
}, 1000);

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Set up observer for dynamic content
let hasDetectedProduct = false;
const observer = new MutationObserver(debounce(() => {
    if (!hasDetectedProduct) {
        hasDetectedProduct = checkProductPage();
        if (hasDetectedProduct) {
            observer.disconnect(); // Stop observing once we've detected a product
        }
    }
}, 1000));

// Start observing the document
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ Product detection script initialized');
