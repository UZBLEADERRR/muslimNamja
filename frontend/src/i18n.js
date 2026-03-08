import { useAppStore } from './store/useAppStore';

const translations = {
    en: {
        welcome: 'Welcome to Muslim Namja',
        menu: 'Menu',
        community: 'Community',
        cart: 'Cart',
        profile: 'Profile',
        delivery: 'Delivery',
        admin: 'Admin',
        add_to_cart: 'Add to Cart',
        total: 'Total',
        checkout: 'Checkout',
        distance_error: 'You are outside the 3km delivery range.',
        free_delivery: 'Free delivery (under 1km)',
        fee_delivery: 'Delivery Fee applied',
        topup_wallet: 'Top Up Wallet',
        empty_cart: 'Your cart is empty',
        category_food: 'Food',
        category_drinks: 'Drinks',
        category_salad: 'Salads',
    },
    ko: {
        welcome: '무슬림 남자에 오신 것을 환영합니다',
        menu: '메뉴',
        community: '커뮤니티',
        cart: '장바구니',
        profile: '프로필',
        delivery: '배달',
        admin: '관리자',
        add_to_cart: '장바구니에 추가',
        total: '총액',
        checkout: '결제하기',
        distance_error: '3km 배달 가능 지역을 벗어났습니다.',
        free_delivery: '무료 배달 (1km 이내)',
        fee_delivery: '배달비가 적용됩니다',
        topup_wallet: '지갑 충전',
        empty_cart: '장바구니가 비어 있습니다',
        category_food: '음식',
        category_drinks: '음료',
        category_salad: '샐러드',
    },
    uz: {
        welcome: 'Muslim Namjaga xush kelibsiz',
        menu: 'Menyu',
        community: 'Jamiyat',
        cart: 'Savat',
        profile: 'Profil',
        delivery: 'Yetkazib berish',
        admin: 'Admin',
        add_to_cart: 'Savatga qoshish',
        total: 'Jami',
        checkout: 'Buyurtma berish',
        distance_error: 'Siz 3km yetkazib berish hududidan tashqaridasiz.',
        free_delivery: 'Bepul yetkazish (1km gacha)',
        fee_delivery: 'Yetkazish xizmati pullik',
        topup_wallet: 'Hisobni toldirish',
        empty_cart: 'Savatingiz bosh',
        category_food: 'Ovqatlar',
        category_drinks: 'Ichimliklar',
        category_salad: 'Salatlar',
    },
    ru: {
        welcome: 'Добро пожаловать в Muslim Namja',
        menu: 'Меню',
        community: 'Сообщество',
        cart: 'Корзина',
        profile: 'Профиль',
        delivery: 'Доставка',
        admin: 'Админ',
        add_to_cart: 'В корзину',
        total: 'Итого',
        checkout: 'Оформить заказ',
        distance_error: 'Вы находитесь вне зоны доставки (3 км).',
        free_delivery: 'Бесплатная доставка (до 1 км)',
        fee_delivery: 'Платная доставка',
        topup_wallet: 'Пополнить кошелек',
        empty_cart: 'Ваша корзина пуста',
        category_food: 'Еда',
        category_drinks: 'Напитки',
        category_salad: 'Салаты',
    }
};

export const useTranslation = () => {
    const lang = useAppStore(state => state.lang);

    const t = (key) => {
        return translations[lang]?.[key] || translations['en'][key] || key;
    };

    return { t, lang };
};
